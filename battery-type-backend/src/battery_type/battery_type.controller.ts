import { Controller, Get, Param, Query, Render, NotFoundException } from '@nestjs/common';
import { BatteryTypeService } from './battery_type.service';
@Controller()
export class BatteryTypeController {
 constructor(private readonly battery_typeService: BatteryTypeService) {}
 @Get('battery_type') @Render('grid')
 showGrid(@Query('minCapacityMah') minimum?: string) {
  return { battery_type: this.battery_typeService.findPublished(minimum ? Number(minimum) : undefined), currentMinCapacityMah: minimum || '' };
 }
 @Get('battery_type/draft') @Render('draft-form')
 showDraft() { return { draft: this.battery_typeService.findDraft() }; }
 @Get('battery_type/feed/:id?') @Render('feed')
 showFeed(@Param('id') id?: string, @Query('next') next?: string) {
  const battery_type = !id || next === 'true' ? this.battery_typeService.findNextAfter(Number(id || 0)) : this.battery_typeService.findOnePublished(Number(id));
  if (!battery_type) throw new NotFoundException();
  return { battery_type };
 }
}
