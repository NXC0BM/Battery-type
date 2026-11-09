import { BatteryTypeStatus } from './battery_type-status.enum';

export type ChemistryType = 'Li-ion' | 'Li-Po' | 'Ni-MH';

export class BatteryType {
  id: number;
  modelName: string;
  chemistryType: ChemistryType;
  capacityMah: number;
  nominalVoltageV: number;
  description: string;
  imageKey: string;
  videoKey: string;
  status: BatteryTypeStatus;
  likesCount: number;
}
