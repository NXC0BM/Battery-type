import { Controller, Get, Post, Param, Query, Body, Render, Redirect, NotFoundException, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { BatteryTypeService } from './battery_type.service';
const CURRENT_USER_ID = 1;
@Controller()
export class BatteryTypeController {
 constructor(private readonly battery_typeService: BatteryTypeService) {}
 @Get('battery_type') @Render('grid')
 async getGrid(@Query('minCapacityMah') minimum?: string) {
  return { battery_type: await this.battery_typeService.findPublished(minimum ? Number(minimum) : undefined), currentMinCapacityMah: minimum || '' };
 }
 @Get('battery_type/draft') @Render('draft-form')
 async getDraftForm() { return { draft: await this.battery_typeService.findDraftByUser(CURRENT_USER_ID) }; }
 @Get('battery_type/feed/:id?') @Render('feed')
 async getFeed(@Param('id') id?: string, @Query('next') next?: string) {
  const battery_type = await this.battery_typeService.getFeedItem(id ? Number(id) : undefined, next === 'true');
  if (!battery_type) throw new NotFoundException(); return { battery_type };
 }
 @Post('battery_type/draft/next') @Redirect('/battery_type/draft',302)
 @UseInterceptors(AnyFilesInterceptor({limits:{files:0}}))
 async createDraft(@Body('modelName') name: string) {
  await this.battery_typeService.createOrUpdateDraft(CURRENT_USER_ID,name,'/missing-battery_type.jpg','/missing-battery_type.mp4');
 }
 @Post('battery_type/draft/publish') @Redirect('/battery_type',302)
 async publishDraft(@Body('shortDescription') description: string,@Body('capacityMah') capacity: string,@Body('nominalVoltageV') voltage: string) {
  await this.battery_typeService.publishDraft(CURRENT_USER_ID,description,Number(capacity),Number(voltage));
 }
 @Post('battery_type/delete') @Redirect('/battery_type',302)
 async deleteBatteryType(@Body('id') id: string) { await this.battery_typeService.deleteBatteryType(Number(id)); }
}
