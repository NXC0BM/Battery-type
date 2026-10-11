import {
  Controller,
  Get,
  Post,
  Param,
  Render,
  Query,
  Body,
  ParseIntPipe,
  Redirect,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AccumulatorsService } from './accumulators.service';

const CURRENT_USER_ID = 1; // без авторизации — фиксированный пользователь

@Controller()
export class AccumulatorsController {
  constructor(private readonly accumulatorsService: AccumulatorsService) {}

  // GET — Плитка (ORM)
  @Get('03-plitka')
  @Render('grid')
  async getGrid(@Query('minCapacityMah') minCapacityMah?: string) {
    const min = minCapacityMah ? parseInt(minCapacityMah, 10) : undefined;
    const accumulators = await this.accumulatorsService.findPublished(min);
    return { accumulators, currentMinCapacityMah: min };
  }

  // GET — Добавление (ORM, есть ли черновик)
  @Get('02-dobavlenie')
  @Render('draft-form')
  async getDraftForm() {
    const draft = await this.accumulatorsService.findDraftByUser(CURRENT_USER_ID);
    return { draft };
  }

  // GET — Лента (курсор, 1 строка)
  @Get('01-lenta/:id')
  @Render('feed')
  async getFeedById(
    @Param('id', ParseIntPipe) id: number,
    @Query('next') next?: string,
  ) {
    const accumulator = await this.accumulatorsService.getFeedItem(id, next === 'true');
    return { accumulator };
  }

  @Get('01-lenta')
  @Render('feed')
  async getFeed() {
    const accumulator = await this.accumulatorsService.getFeedItem();
    return { accumulator };
  }

    // POST — кнопка "Далее" (ORM, создание/обновление черновика + файлы)
  @Post('02-dobavlenie/next')
  @Redirect('/02-dobavlenie', 302)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'photo', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './public/uploads',
          filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, unique + extname(file.originalname));
          },
        }),
      },
    ),
  )
  async createDraft(
    @Body('modelName') modelName: string,
    @UploadedFiles() files: { photo?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    const imageUrl = files?.photo?.[0] ? `/uploads/${files.photo[0].filename}` : undefined;
    const videoUrl = files?.video?.[0] ? `/uploads/${files.video[0].filename}` : undefined;
    await this.accumulatorsService.createOrUpdateDraft(CURRENT_USER_ID, modelName, imageUrl, videoUrl);
  }

  // POST — кнопка "Опубликовать" (ORM)
  @Post('02-dobavlenie/publish')
  @Redirect('/03-plitka', 302)
  async publishDraft(
    @Body('shortDescription') shortDescription: string,
    @Body('capacityMah') capacityMah: string,
    @Body('nominalVoltageV') nominalVoltageV: string,
  ) {
    await this.accumulatorsService.publishDraft(
      CURRENT_USER_ID,
      shortDescription,
      parseInt(capacityMah, 10),
      parseFloat(nominalVoltageV),
    );
  }

  // POST — логическое удаление (raw SQL UPDATE, без ORM)
  @Post('03-plitka/delete')
  @Redirect('/03-plitka', 302)
  async deleteAccumulator(@Body('id') id: string) {
    await this.accumulatorsService.deleteAccumulator(parseInt(id, 10));
  }
}
