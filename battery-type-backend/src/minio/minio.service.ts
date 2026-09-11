import { Injectable } from '@nestjs/common';

@Injectable()
export class MinioService {
  // В .env потом можно вынести MINIO_PUBLIC_URL, пока — значение по умолчанию
  private readonly endpoint =
    process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
  private readonly bucket = 'bucket1';

  buildUrl(key: string): string {
    if (!key) return '';
    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
