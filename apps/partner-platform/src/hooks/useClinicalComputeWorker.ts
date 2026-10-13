import { useRef, useCallback, useEffect } from 'react';
import type { ComputeMessageRequest, ComputeMessageResponse } from '../workers/clinicalComputeWorker.js';

export function useClinicalComputeWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacks = useRef<Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>>(new Map());

  useEffect(() => {
    // Instantiate web worker lazily using Vite worker import syntax
    try {
      workerRef.current = new Worker(
        new URL('../workers/clinicalComputeWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent<ComputeMessageResponse>) => {
        const { id, success, result, error } = e.data;
        const cb = pendingCallbacks.current.get(id);
        if (cb) {
          pendingCallbacks.current.delete(id);
          if (success) {
            cb.resolve(result);
          } else {
            cb.reject(new Error(error || 'Worker calculation failed'));
          }
        }
      };
    } catch {
      // Fallback if workers unsupported
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const dispatchCompute = useCallback(
    <TResult = any>(type: ComputeMessageRequest['type'], payload: any): Promise<TResult> => {
      return new Promise((resolve, reject) => {
        const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        pendingCallbacks.current.set(id, { resolve, reject });

        if (workerRef.current) {
          workerRef.current.postMessage({ id, type, payload });
        } else {
          // Synchronous fallback if Web Worker is not available in environment
          setTimeout(() => {
            reject(new Error('Web Worker unavailable'));
          }, 0);
        }
      });
    },
    []
  );

  return { dispatchCompute };
}
