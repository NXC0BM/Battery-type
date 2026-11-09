// Только отдельная демонстрационная БД, никогда не рабочая база.
require('dotenv').config();
const { Client } = require('pg');
const { Client: S3 } = require('minio');
const fs = require('fs');
async function main() {
  if (process.env.DB_DATABASE !== 'battery_type_review') throw Error('Разрешена только battery_type_review');
  const db = new Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE });
  await db.connect();
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL);
    CREATE TABLE IF NOT EXISTS battery_type (id SERIAL PRIMARY KEY, model_name VARCHAR(100) NOT NULL,
      short_description VARCHAR(255), status VARCHAR(20) NOT NULL DEFAULT 'draft', image_url VARCHAR(255), video_url VARCHAR(255),
      capacity_mah INTEGER, nominal_voltage_v NUMERIC(4,2), created_at TIMESTAMP NOT NULL DEFAULT now(),
      published_at TIMESTAMP, completed_at TIMESTAMP, creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      moderator_id INTEGER REFERENCES users(id) ON DELETE RESTRICT);
    CREATE TABLE IF NOT EXISTS likes (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      battery_type_id INTEGER NOT NULL REFERENCES battery_type(id) ON DELETE RESTRICT);`);
    for (const file of ['002_attributes_eav.sql', '003_move_topic_fields.sql']) {
      await db.query(fs.readFileSync(`migrations/${file}`, 'utf8'));
    }
  } finally { await db.end(); }
  const s3 = new S3({ endPoint: process.env.MINIO_HOST, port: +process.env.MINIO_PORT, useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY, secretKey: process.env.MINIO_SECRET_KEY });
  if (!await s3.bucketExists('bucket1')) await s3.makeBucket('bucket1');
  await s3.setBucketPolicy('bucket1', JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow',
    Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::bucket1/*'] }] }));
  console.log('Отдельное окружение battery_type_review готово');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
