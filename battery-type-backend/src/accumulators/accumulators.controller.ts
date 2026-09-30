import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AccumulatorsService } from './accumulators.service';
import { PublishAccumulatorDto } from './dto/publish-accumulator.dto';
import { LikeAccumulatorDto } from './dto/like-accumulator.dto';

@Controller('accumulators')
export class AccumulatorsController {
  constructor(private readonly accumulatorsService: AccumulatorsService) {}

  // GET список (только опубликованные), фильтр по ёмкости
  @Get()
  async getList(@Query('minCapacityMah') minCapacityMah?: string) {
    const min = minCapacityMah ? parseInt(minCapacityMah, 10) : undefined;
    return this.accumulatorsService.findPublished(min);
  }

  // GET лента (без ид — первая; с ид и next=true — следующая)
  @Get('feed')
  async getFeed(@Query('id') id?: string, @Query('next') next?: string) {
    const parsedId = id ? parseInt(id, 10) : undefined;
    return this.accumulatorsService.getFeedItem(parsedId, next === 'true');
  }

  // GET черновик текущего пользователя
  @Get('draft')
  async getDraft() {
    return this.accumulatorsService.getDraft();
  }

  // POST добавление + файлы (multipart/form-data)
  @Post()
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
  ) {
    return this.accumulatorsService.createDraft(
      modelName,
      files?.image?.[0],
      files?.video?.[0],
    );
  }

  // PUT публикация
  @Put(':id/publish')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishAccumulatorDto,
  ) {
    return this.accumulatorsService.publish(
      id,
      dto.shortDescription,
      dto.capacityMah,
      dto.nominalVoltageV,
    );
  }

  // DELETE — soft delete, только свои
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.accumulatorsService.remove(id);
  }

  @Post(':id/like')
  @HttpCode(200)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeAccumulatorDto,
  ) {
    await this.accumulatorsService.setLike(id, dto.like);
    return this.accumulatorsService.getFeedItem(id);
  }
}
