import re
from pathlib import Path
replacements=[('Accumulators','BatteryType'),('accumulators','battery_type'),('Accumulator','BatteryType'),('accumulator','battery_type'),('03-plitka','battery_type'),('02-dobavlenie','battery_type/draft'),('01-lenta','battery_type/feed'),('AMPHOUR','Battery Type')]
for num in [1,2,3]:
 root=Path(f'C:/Web/Battery-type-lab{num}'); app=root/('battery-type-backend' if num<3 else 'battery-runtime-backend')
 for f in list(root.rglob('*')):
  if f.is_file() and f.suffix in ['.ts','.hbs','.css','.md','.yml','.json'] and f.name!='package-lock.json':
   s=f.read_text(encoding='utf-8-sig')
   for a,b in replacements:s=s.replace(a,b)
   if f.name=='main.ts':s=s.replace('await app.listen(3000);',f"await app.listen(Number(process.env.PORT || {53010+num}));")
   f.write_text(s,encoding='utf-8')
 # Rename file and directory paths, deepest first.
 for f in sorted(app.rglob('*'),key=lambda p:len(p.parts),reverse=True):
  name=f.name
  for a,b in replacements[:4]:name=name.replace(a,b)
  if name!=f.name:f.rename(f.with_name(name))
 if num==1:
  service=app/'src/battery_type/battery_type.service.ts';s=service.read_text(encoding='utf-8')
  s=re.sub(r'likedByEngineerIds: \[([^\]]*)\]',lambda m:'likesCount: '+str(len([x for x in m[1].split(',') if x.strip()])),s).replace('acc.likedByEngineerIds.length','acc.likesCount')
  service.write_text(s,encoding='utf-8')
  entity=app/'src/battery_type/entities/battery_type.entity.ts';s=entity.read_text(encoding='utf-8').replace('likedByEngineerIds: number[];','likesCount: number;');entity.write_text(s,encoding='utf-8')
  controller=app/'src/battery_type/battery_type.controller.ts'
  controller.write_text('''import { Controller, Get, Param, Query, Render, NotFoundException } from '@nestjs/common';
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
''',encoding='utf-8')
 if num==2:
  # Exactly three GET + three POST. No media upload/storage in lab2.
  controller=app/'src/battery_type/battery_type.controller.ts'
  controller.write_text('''import { Controller, Get, Post, Param, Query, Body, Render, Redirect, NotFoundException, UseInterceptors } from '@nestjs/common';
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
''',encoding='utf-8')
  # Native form fields do not submit files; URL values are deliberately unavailable.
  f=app/'views/draft-form.hbs';s=f.read_text(encoding='utf-8').replace(' name="photo"','').replace(' name="video"','');f.write_text(s,encoding='utf-8')
  service=app/'src/battery_type/battery_type.service.ts';s=service.read_text(encoding='utf-8');start=s.index('  /**');end=s.index('  // Логическое удаление',start)
  s=s[:start]+'''  // ORM: БД возвращает одну опубликованную запись, не всю коллекцию.
  async getFeedItem(id?: number, next = false): Promise<any | null> {
    const qb = this.battery_typeRepository.createQueryBuilder('b').where('b.status = :status',{status: BatteryTypeStatus.PUBLISHED});
    if (id !== undefined) qb.andWhere(next ? 'b.id > :id' : 'b.id = :id',{id});
    const row = await qb.orderBy('b.id','ASC').take(1).getOne();
    if (!row && next) return this.getFeedItem();
    if (!row) return null;
    const result = await this.battery_typeRepository.manager.getRepository(Like).count({where:{battery_type:{id:row.id}}});
    return {...row,likesCount:result};
  }

'''+s[end:];service.write_text(s,encoding='utf-8')
 (root/'FIXES.md').write_text(f'''# Исправления ЛР{num}
Названия модели, таблицы, путей и обработчиков приведены к battery_type.
Поля темы: capacityMah (мА·ч), nominalVoltageV (В); фильтр по нижней границе ёмкости.
Схема атрибутов отработки РК применяется к итоговому бэкенду ЛР4, а не задним числом к этапам ЛР1–2.
''',encoding='utf-8')
print('Prepared topic names and lab-specific corrections in worktrees 1–3')
