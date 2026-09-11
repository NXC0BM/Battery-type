import { AccumulatorStatus } from './accumulator-status.enum';

export type ChemistryType = 'Li-ion' | 'Li-Po' | 'Ni-MH';

export class Accumulator {
  id: number;
  modelName: string;
  chemistryType: ChemistryType;
  capacityMah: number;
  nominalVoltageV: number;
  description: string;
  imageKey: string;
  videoKey: string;
  status: AccumulatorStatus;
  likedByEngineerIds: number[];
}
