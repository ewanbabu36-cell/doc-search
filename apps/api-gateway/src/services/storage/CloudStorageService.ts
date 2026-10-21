import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createLogger } from '@docsearch/shared-core';

const logger = createLogger('cloud-storage-service');

export interface StorageConfig {
  bucket?: string | undefined;
  region?: string | undefined;
  endpoint?: string | undefined;
  accessKeyId?: string | undefined;
  secretAccessKey?: string | undefined;
  forcePathStyle?: boolean | undefined;
  localStorageDir?: string | undefined;
}

export interface UploadResult {
  key: string;
  url: string;
  mode: 'S3_CLOUD' | 'LOCAL_DISK';
  size: number;
  contentType: string;
  etag?: string | undefined;
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  method: 'GET' | 'PUT';
  expiresInSeconds: number;
  mode: 'S3_CLOUD' | 'LOCAL_DISK';
}

export class CloudStorageService {
  private readonly bucket: string | undefined;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;
  private readonly forcePathStyle: boolean;
  private readonly localStorageDir: string;

  constructor(config?: StorageConfig) {
    this.bucket = config?.bucket ?? process.env['S3_BUCKET'];
    this.region = config?.region ?? process.env['S3_REGION'] ?? process.env['AWS_REGION'] ?? 'ap-south-1';
    this.endpoint = (
      config?.endpoint ??
      process.env['S3_ENDPOINT'] ??
      `https://s3.${this.region}.amazonaws.com`
    ).replace(/\/+$/, '');
    this.accessKeyId =
      config?.accessKeyId ??
      process.env['S3_ACCESS_KEY_ID'] ??
      process.env['AWS_ACCESS_KEY_ID'];
    this.secretAccessKey =
      config?.secretAccessKey ??
      process.env['S3_SECRET_ACCESS_KEY'] ??
      process.env['AWS_SECRET_ACCESS_KEY'];
    this.forcePathStyle =
      config?.forcePathStyle ??
      (process.env['S3_FORCE_PATH_STYLE'] === 'true' ||
        this.endpoint.includes('localhost') ||
        this.endpoint.includes('127.0.0.1'));
    this.localStorageDir =
      config?.localStorageDir ??
      process.env['LOCAL_STORAGE_DIR'] ??
      path.resolve(process.cwd(), 'data', 'storage');
  }

  public isCloudConfigured(): boolean {
    return Boolean(this.bucket && this.accessKeyId && this.secretAccessKey);
  }

  /**
   * Upload file to S3/MinIO if configured, otherwise persist to local filesystem
   */
  public async upload(params: {
    key: string;
    buffer: Buffer;
    contentType?: string | undefined;
    metadata?: Record<string, string> | undefined;
  }): Promise<UploadResult> {
    const { key, buffer, contentType = 'application/octet-stream', metadata = {} } = params;
    const cleanKey = key.replace(/^\/+/, '');

    if (this.isCloudConfigured()) {
      try {
        const uploadUrl = this.buildObjectUrl(cleanKey);
        const headers: Record<string, string> = {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString()
        };

        for (const [metaK, metaV] of Object.entries(metadata)) {
          headers[`x-amz-meta-${metaK.toLowerCase()}`] = metaV;
        }

        const signedHeaders = this.signRequest('PUT', uploadUrl, headers, buffer);
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: signedHeaders,
          body: buffer
        });

        if (!response.ok) {
          const errText = await response.text();
          logger.warn('S3 upload returned non-200 status, falling back to local storage', {
            status: response.status,
            error: errText
          });
          return this.saveToLocalDisk(cleanKey, buffer, contentType);
        }

        const etag = response.headers.get('etag')?.replace(/"/g, '') || undefined;
        logger.info('File successfully uploaded to S3 cloud storage', { key: cleanKey, bucket: this.bucket });

        return {
          key: cleanKey,
          url: uploadUrl,
          mode: 'S3_CLOUD',
          size: buffer.length,
          contentType,
          etag
        };
      } catch (err) {
        logger.error('Failed to upload to S3, falling back to local disk storage', err);
        return this.saveToLocalDisk(cleanKey, buffer, contentType);
      }
    }

    return this.saveToLocalDisk(cleanKey, buffer, contentType);
  }

  /**
   * Generates a presigned GET URL for secure expiring downloads
   */
  public async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<PresignedUrlResult> {
    const cleanKey = key.replace(/^\/+/, '');

    if (!this.isCloudConfigured()) {
      return {
        url: `/api/v1/storage/local/${cleanKey}`,
        key: cleanKey,
        method: 'GET',
        expiresInSeconds,
        mode: 'LOCAL_DISK'
      };
    }

    const objectUrl = this.buildObjectUrl(cleanKey);
    const presignedUrl = this.generatePresignedUrl('GET', objectUrl, expiresInSeconds);

    return {
      url: presignedUrl,
      key: cleanKey,
      method: 'GET',
      expiresInSeconds,
      mode: 'S3_CLOUD'
    };
  }

  /**
   * Generates a presigned PUT URL for direct client-to-cloud uploads
   */
  public async getPresignedUploadUrl(
    key: string,
    contentType = 'application/octet-stream',
    expiresInSeconds = 1800
  ): Promise<PresignedUrlResult> {
    const cleanKey = key.replace(/^\/+/, '');

    if (!this.isCloudConfigured()) {
      return {
        url: `/api/v1/storage/upload/${cleanKey}`,
        key: cleanKey,
        method: 'PUT',
        expiresInSeconds,
        mode: 'LOCAL_DISK'
      };
    }

    const objectUrl = this.buildObjectUrl(cleanKey);
    const presignedUrl = this.generatePresignedUrl('PUT', objectUrl, expiresInSeconds, {
      'content-type': contentType
    });

    return {
      url: presignedUrl,
      key: cleanKey,
      method: 'PUT',
      expiresInSeconds,
      mode: 'S3_CLOUD'
    };
  }

  /**
   * Read file content as Buffer
   */
  public async readFile(key: string): Promise<Buffer | null> {
    const cleanKey = key.replace(/^\/+/, '');

    if (this.isCloudConfigured()) {
      try {
        const objectUrl = this.buildObjectUrl(cleanKey);
        const signedHeaders = this.signRequest('GET', objectUrl, {});
        const response = await fetch(objectUrl, { headers: signedHeaders });
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (err) {
        logger.warn('S3 readFile failed, attempting local fallback', { key: cleanKey, error: String(err) });
      }
    }

    const filePath = path.join(this.localStorageDir, cleanKey);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  private async saveToLocalDisk(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    const targetPath = path.join(this.localStorageDir, key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, buffer);

    logger.info('File saved to local disk storage fallback', { key, path: targetPath });

    return {
      key,
      url: `file://${targetPath}`,
      mode: 'LOCAL_DISK',
      size: buffer.length,
      contentType
    };
  }

  private buildObjectUrl(key: string): string {
    const cleanKey = encodeURI(key);
    if (this.forcePathStyle || !this.bucket) {
      return `${this.endpoint}/${this.bucket ? this.bucket + '/' : ''}${cleanKey}`;
    }
    const endpointUrl = new URL(this.endpoint);
    return `${endpointUrl.protocol}//${this.bucket}.${endpointUrl.host}/${cleanKey}`;
  }

  /**
   * AWS Signature Version 4 (SigV4) header generator
   */
  private signRequest(
    method: string,
    urlStr: string,
    headers: Record<string, string>,
    payloadBuffer?: Buffer
  ): Record<string, string> {
    if (!this.accessKeyId || !this.secretAccessKey) return headers;

    const url = new URL(urlStr);
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');

    const payloadHash = crypto
      .createHash('sha256')
      .update(payloadBuffer || Buffer.alloc(0))
      .digest('hex');

    const canonicalHeadersMap: Record<string, string> = {
      ...headers,
      host: url.host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash
    };

    const headerKeys = Object.keys(canonicalHeadersMap).map((k) => k.toLowerCase()).sort();
    const canonicalHeadersStr = headerKeys
      .map((k) => `${k}:${canonicalHeadersMap[k]?.trim()}\n`)
      .join('');
    const signedHeadersStr = headerKeys.join(';');

    const canonicalRequest = [
      method,
      url.pathname,
      url.search.slice(1),
      canonicalHeadersStr,
      signedHeadersStr,
      payloadHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const signingKey = this.getSignatureKey(this.secretAccessKey, dateStamp, this.region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

    return {
      ...headers,
      host: url.host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authHeader
    };
  }

  /**
   * AWS Signature Version 4 (SigV4) Query String Presigner
   */
  private generatePresignedUrl(
    method: string,
    urlStr: string,
    expiresInSeconds: number,
    additionalHeaders: Record<string, string> = {}
  ): string {
    if (!this.accessKeyId || !this.secretAccessKey) return urlStr;

    const url = new URL(urlStr);
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const headersMap: Record<string, string> = {
      host: url.host,
      ...additionalHeaders
    };
    const headerKeys = Object.keys(headersMap).map((k) => k.toLowerCase()).sort();
    const signedHeadersStr = headerKeys.join(';');
    const canonicalHeadersStr = headerKeys
      .map((k) => `${k}:${headersMap[k]?.trim()}\n`)
      .join('');

    const queryParams = new URLSearchParams(url.search);
    queryParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    queryParams.set('X-Amz-Credential', `${this.accessKeyId}/${credentialScope}`);
    queryParams.set('X-Amz-Date', amzDate);
    queryParams.set('X-Amz-Expires', expiresInSeconds.toString());
    queryParams.set('X-Amz-SignedHeaders', signedHeadersStr);

    queryParams.sort();
    const canonicalQueryStr = queryParams.toString();

    const canonicalRequest = [
      method,
      url.pathname,
      canonicalQueryStr,
      canonicalHeadersStr,
      signedHeadersStr,
      'UNSIGNED-PAYLOAD'
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const signingKey = this.getSignatureKey(this.secretAccessKey, dateStamp, this.region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    queryParams.set('X-Amz-Signature', signature);

    return `${url.protocol}//${url.host}${url.pathname}?${queryParams.toString()}`;
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
    const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
    return crypto.createHmac('sha256', kService).update('aws4_request').digest();
  }
}

export const cloudStorageService = new CloudStorageService();
