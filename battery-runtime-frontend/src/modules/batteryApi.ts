import { BATTERY_TYPES_MOCK } from "./mock";

// Доп. характеристика услуги (EAV): атрибут — значение — единица измерения
export interface BatteryAttribute {
  name: string;
  value: string;
  unit?: string | null;
}

// Тип аккумулятора — поля как в BatteryTypeResponseDto веб-сервиса
export interface BatteryType {
  id: number;
  modelName: string;
  shortDescription: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  capacityMah: number | null;
  nominalVoltageV: number | null;
  likesCount: number;
  attributes?: BatteryAttribute[];
}

// В ЛР5 данные берутся только из mock-коллекции, без веб-сервиса, БД и S3.
// Функции асинхронные, чтобы в ЛР6 заменить тело на запросы к /api/battery_type.

// Список для плитки с фильтром по минимальной ёмкости
export const getBatteryTypes = async (minCapacityMah = 0): Promise<BatteryType[]> =>
  BATTERY_TYPES_MOCK.filter((item) => (item.capacityMah ?? 0) >= minCapacityMah);

// Одна карточка для ленты (страница «подробнее») вместе с атрибутами; без id — первая
export const getFeedItem = async (id?: number): Promise<BatteryType | null> => {
  if (!id) return BATTERY_TYPES_MOCK[0] ?? null;
  return BATTERY_TYPES_MOCK.find((item) => item.id === id) ?? null;
};
