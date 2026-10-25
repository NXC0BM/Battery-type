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

// Список для плитки с фильтром по минимальной ёмкости.
// Если веб-сервис недоступен — данные из mock-коллекции.
export const getBatteryTypes = async (minCapacityMah = 0): Promise<BatteryType[]> => {
  const query = minCapacityMah ? `?minCapacityMah=${minCapacityMah}` : "";
  try {
    const response = await fetch(`/api/battery_type${query}`);
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch {
    return BATTERY_TYPES_MOCK.filter((item) => (item.capacityMah ?? 0) >= minCapacityMah);
  }
};

// Одна карточка для ленты (страница «подробнее») вместе с атрибутами.
// Без id — первая карточка, next = true — следующая после id.
export const getFeedItem = async (id?: number, next = false): Promise<BatteryType | null> => {
  const params = new URLSearchParams();
  if (id) params.set("id", String(id));
  if (next) params.set("next", "true");
  try {
    const response = await fetch(`/api/battery_type/feed?${params}`);
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } catch {
    if (!id) return BATTERY_TYPES_MOCK[0] ?? null;
    const index = BATTERY_TYPES_MOCK.findIndex((item) => item.id === id);
    if (index === -1) return null;
    return next ? BATTERY_TYPES_MOCK[index + 1] ?? BATTERY_TYPES_MOCK[index] : BATTERY_TYPES_MOCK[index];
  }
};
