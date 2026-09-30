/**
 * Wholesale Inventory Processor
 * Provides a clean Promise-based API for off-thread invoice processing.
 *
 * Utilizes `wholesale-inventory.worker.ts` so parsing 5,000+ line items never
 * drops UI framerate from 120fps.
 */

import {
  type WholesaleWorkerInputMessage,
  type WholesaleWorkerOutputMessage,
  type WholesaleProcessedRow,
  type WholesaleProcessedInvoiceSummary,
  processWholesaleRows,
  parseCsvLines
} from '../workers/wholesale-inventory.worker.js';

export interface ProcessWholesaleCsvOptions {
  supplierName?: string;
  supplierGstin?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  defaultGstRate?: number;
  onProgress?: (progress: { percent: number; processedRows: number; totalRows: number }) => void;
}

export interface ProcessedWholesaleInvoiceResult {
  rows: WholesaleProcessedRow[];
  summary: WholesaleProcessedInvoiceSummary;
  workerUsed: boolean;
}

export class WholesaleInventoryProcessor {
  private worker: Worker | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window !== 'undefined' && typeof window.Worker !== 'undefined') {
      try {
        // Modern Vite Web Worker instantiation
        this.worker = new Worker(
          new URL('../workers/wholesale-inventory.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (err) {
        console.warn('Web Worker initialization failed; falling back to main-thread processing', err);
        this.worker = null;
      }
    }
  }

  /**
   * Processes a CSV string or File off-thread in the Web Worker
   */
  public async processCsv(
    csvInput: string | File,
    options: ProcessWholesaleCsvOptions = {}
  ): Promise<ProcessedWholesaleInvoiceResult> {
    const csvContent = typeof csvInput === 'string'
      ? csvInput
      : await csvInput.text();

    const activeWorker = this.worker;
    if (activeWorker) {
      return new Promise<ProcessedWholesaleInvoiceResult>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WholesaleWorkerOutputMessage>) => {
          const { type, percent, processedRows, totalRows, rows, summary, error } = event.data;

          if (type === 'PROGRESS') {
            options.onProgress?.({
              percent: percent || 0,
              processedRows: processedRows || 0,
              totalRows: totalRows || 0
            });
          } else if (type === 'DONE' && rows && summary) {
            cleanup();
            resolve({
              rows,
              summary,
              workerUsed: true
            });
          } else if (type === 'ERROR') {
            cleanup();
            reject(new Error(error || 'Worker failed to parse wholesale CSV'));
          }
        };

        const handleError = (err: ErrorEvent) => {
          cleanup();
          reject(new Error(err.message || 'Worker encountered an unhandled error'));
        };

        const cleanup = () => {
          activeWorker.removeEventListener('message', handleMessage);
          activeWorker.removeEventListener('error', handleError);
        };

        activeWorker.addEventListener('message', handleMessage);
        activeWorker.addEventListener('error', handleError);

        const message: WholesaleWorkerInputMessage = {
          type: 'PARSE_CSV',
          payload: {
            csvContent,
            supplierName: options.supplierName,
            supplierGstin: options.supplierGstin,
            invoiceNumber: options.invoiceNumber,
            invoiceDate: options.invoiceDate,
            defaultGstRate: options.defaultGstRate ?? 12
          }
        };

        activeWorker.postMessage(message);
      });
    }

    // Main thread fallback if worker is unavailable
    const rawRows = parseCsvLines(csvContent);
    const { rows, summary } = processWholesaleRows(
      rawRows,
      options.defaultGstRate ?? 12,
      (pct, processed, total) => {
        options.onProgress?.({ percent: pct, processedRows: processed, totalRows: total });
      }
    );

    if (options.supplierName) summary.supplierName = options.supplierName;
    if (options.supplierGstin) summary.supplierGstin = options.supplierGstin;
    if (options.invoiceNumber) summary.invoiceNumber = options.invoiceNumber;
    if (options.invoiceDate) summary.invoiceDate = options.invoiceDate;

    return {
      rows,
      summary,
      workerUsed: false
    };
  }

  /**
   * Ingests parsed wholesale invoice into the backend database stock ledger
   */
  public async submitWholesaleInvoiceToBackend(
    invoiceData: ProcessedWholesaleInvoiceResult,
    apiBaseUrl = ''
  ): Promise<{ success: boolean; inwardedCount: number; batchIds: string[]; message: string }> {
    const payload = {
      invoiceNumber: invoiceData.summary.invoiceNumber,
      invoiceDate: invoiceData.summary.invoiceDate,
      supplierName: invoiceData.summary.supplierName,
      supplierGstin: invoiceData.summary.supplierGstin,
      items: invoiceData.rows.map((r) => ({
        itemDescription: r.rawDescription,
        pack: r.pack,
        hsnCode: r.hsnCode,
        mfr: r.manufacturer,
        batchNumber: r.batchNumber,
        expiryDate: r.expiryDate,
        billedQuantity: r.billedQuantity,
        freeQuantity: r.freeQuantity,
        unitCostPtr: r.unitCostPtr,
        mrp: r.mrp,
        discountPercent: r.discountPercent,
        gstRate: r.gstRate
      }))
    };

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${apiBaseUrl}/api/v1/partner/pharmacy/invoices/ingest-wholesale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to ingest wholesale invoice (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      success: true,
      inwardedCount: data.itemsIngested || invoiceData.rows.length,
      batchIds: data.batchIds || [],
      message: data.message || 'Wholesale invoice stock successfully inwarded into ledger'
    };
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const wholesaleInventoryProcessor = new WholesaleInventoryProcessor();
