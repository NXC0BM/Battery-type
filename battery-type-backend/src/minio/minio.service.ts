import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { slugify } from 'transliteration';

@Injectable()
export class MinioService {
  private client: Minio.Client;
  private readonly bucket = 'bucket1';
  private readonly endpoint: string;

  constructor(private config: ConfigService) {
    this.endpoint = this.config.get('MINIO_PUBLIC_URL', 'http://localhost:9000');

    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_HOST', 'localhost'),
      port: parseInt(this.config.get('MINIO_PORT', '9000'), 10),
      useSSL: false,
      accessKey: this.config.get('MINIO_ACCESS_KEY'),
      secretKey: this.config.get('MINIO_SECRET_KEY'),
    });
  }

  buildUrl(key: string | null): string | null {
    if (!key) return null;
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  // Загрузка файла, имя генерируется на латинице
  async uploadFile(buffer: Buffer, originalName: string, prefix: string): Promise<string> {
    const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
    const base =
      slugify(originalName.replace(/\.[^/.]+$/, ''), { lowercase: true, separator: '-' }) ||
      'file';
    const fileName = `${prefix}-${base}-${Date.now()}.${ext}`;

    await this.client.putObject(this.bucket, fileName, buffer, buffer.length);
    return fileName;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch {
      // не критично
    }
  }
}
