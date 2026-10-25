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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Список опубликованных карточек (доступно без авторизации)' })
  async getList(
    @Query('minCapacityMah') minCapacityMah?: string,
    @Req() req?: any,
  ) {
    const min = minCapacityMah ? parseInt(minCapacityMah, 10) : undefined;
    return this.batteryTypeService.findPublished(min, req?.session?.userId);
  }

  // GET лента — доступно гостям
  @Get('feed')
  @ApiOperation({ summary: 'Лента (доступно без авторизации)' })
  async getFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
    @Req() req?: any,
  ) {
    const parsedId = id ? parseInt(id, 10) : undefined;
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
