import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { BatteryType } from '../src/battery_type/entities/battery-type.entity';
import { Attribute } from '../src/attributes/attribute.entity';
import { BatteryTypeAttribute } from '../src/attributes/battery-type-attribute.entity';
import { Like } from '../src/likes/like.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, BatteryType, Like, Attribute, BatteryTypeAttribute],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  await dataSource.synchronize();
  console.log('Миграции выполнены успешно.');
  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграций:', err);
  process.exit(1);
});
