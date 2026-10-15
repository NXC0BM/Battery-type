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
import { AccumulatorsService } from './accumulators.service';
import { PublishAccumulatorDto } from './dto/publish-accumulator.dto';
import { LikeAccumulatorDto } from './dto/like-accumulator.dto';
import { SessionAuthGuard } from '../common/session-auth.guard';

@ApiTags('accumulators')
@Controller('accumulators')
export class AccumulatorsController {
  constructor(private readonly accumulatorsService: AccumulatorsService) {}

  // GET список — доступно гостям, isMine считается если есть сессия
  @Get()
  @ApiOperation({ summary: 'Список опубликованных карточек (доступно без авторизации)' })
  async getList(
    @Query('minCapacityMah') minCapacityMah?: string,
    @Req() req?: any,
  ) {
    const min = minCapacityMah ? parseInt(minCapacityMah, 10) : undefined;
    return this.accumulatorsService.findPublished(min, req?.session?.userId);
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
    return this.accumulatorsService.getFeedItem(
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
    return this.accumulatorsService.getDraft(req.session.userId);
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
    return this.accumulatorsService.createDraft(
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
    @Body() dto: PublishAccumulatorDto,
    @Req() req: any,
  ) {
    return this.accumulatorsService.publish(
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
    await this.accumulatorsService.remove(id, req.session.userId);
  }

  // POST лайк — требует авторизации
  @Post(':id/like')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Поставить/убрать лайк' })
  @HttpCode(200)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeAccumulatorDto,
    @Req() req: any,
  ) {
    await this.accumulatorsService.setLike(id, req.session.userId, dto.like);
    return this.accumulatorsService.getFeedItem(id, false, req.session.userId);
  }
}
