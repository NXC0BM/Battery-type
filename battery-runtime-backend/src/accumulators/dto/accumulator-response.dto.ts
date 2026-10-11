export class AccumulatorResponseDto {
  id: number;
  modelName: string;
  shortDescription: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  capacityMah: number | null;
  nominalVoltageV: number | null;
  likesCount: number;
  isMine: number; // 0/1
}
