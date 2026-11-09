import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { BatteryTypeService } from './battery_type.service';
import { PublishBatteryTypeDto } from './dto/publish-battery-type.dto';
import { LikeBatteryTypeDto } from './dto/like-battery-type.dto';
import { SessionAuthGuard } from '../common/session-auth.guard';

@ApiTags('battery_type')
@Controller('battery_type')
export class BatteryTypeController {
  constructor(private readonly batteryTypeService: BatteryTypeService) {}

  // GET список — доступно гостям, isMine считается если есть сессия
  @Get()
  @ApiQuery({ name: 'minCapacityMah', required: false, type: Number })
  @ApiOperation({ summary: 'Список опубликованных карточек (доступно без авторизации)' })
  async getList(
    @Query('minCapacityMah') minCapacityMah?: string,
    @Req() req?: any,
  ) {
    if (minCapacityMah !== undefined && !/^\d+$/.test(minCapacityMah))
      throw new BadRequestException('Ёмкость должна быть целым неотрицательным числом');
    const min = minCapacityMah !== undefined ? Number(minCapacityMah) : undefined;
    return this.batteryTypeService.findPublished(min, req?.session?.userId);
  }

  // GET лента — доступно гостям
  @Get('feed')
  @ApiQuery({ name: 'id', required: false, type: Number })
  @ApiQuery({ name: 'next', required: false, type: Boolean })
  @ApiOperation({ summary: 'Лента (доступно без авторизации)' })
  async getFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
    @Req() req?: any,
  ) {
    if (id !== undefined && !/^[1-9]\d*$/.test(id)) throw new BadRequestException('Некорректный id');
    if (next !== undefined && !['true', 'false'].includes(next)) throw new BadRequestException('next: true или false');
    const parsedId = id ? Number(id) : undefined;
    return this.batteryTypeService.getFeedItem(
      parsedId,
      next === 'true',
      req?.session?.userId,
    );
  }

  // GET черновик текущего пользователя — требует авторизации
  @Get('draft')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Черновик текущего пользователя' })
  async getDraft(@Req() req: any) {
    return this.batteryTypeService.getDraft(req.session.userId);
  }

  // POST добавление — требует авторизации
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['modelName'], properties: {
    modelName: { type: 'string' }, image: { type: 'string', format: 'binary' }, video: { type: 'string', format: 'binary' },
  } } })
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Создать черновик с файлами' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  @HttpCode(201)
  async create(
    @Body('modelName') modelName: string,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    return this.batteryTypeService.createDraft(
      modelName,
      req.session.userId,
      files?.image?.[0],
      files?.video?.[0],
    );
  }

  // PUT публикация — требует авторизации
  @Put(':id/publish')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Опубликовать черновик' })
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishBatteryTypeDto,
    @Req() req: any,
  ) {
    return this.batteryTypeService.publish(
      id,
      req.session.userId,
      dto.shortDescription,
      dto.capacityMah,
      dto.nominalVoltageV,
      dto.attributes,
    );
  }

  // DELETE — требует авторизации
  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Удалить карточку (своя)' })
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.batteryTypeService.remove(id, req.session.userId);
  }

  // POST лайк — требует авторизации
  @Post(':id/like')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Поставить/убрать лайк' })
  @HttpCode(200)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeBatteryTypeDto,
    @Req() req: any,
  ) {
    await this.batteryTypeService.setLike(id, req.session.userId, dto.like);
    return this.batteryTypeService.getFeedItem(id, false, req.session.userId);
  }
}
