import { Controller, Get, Param, Query, Render, NotFoundException } from '@nestjs/common';
import { AccumulatorsService } from './accumulators.service';

@Controller()
export class AccumulatorsController {
  constructor(private readonly accumulatorsService: AccumulatorsService) {}

  // Страница "Плитка": /03-plitka?minCapacityMah=2000
  @Get('03-plitka')
  @Render('grid')
  showGrid(@Query('minCapacityMah') minCapacityMah?: string) {
    const parsed = minCapacityMah ? Number(minCapacityMah) : undefined;
    const accumulators = this.accumulatorsService.findPublished(parsed);
    return { accumulators, currentMinCapacityMah: minCapacityMah || '' };
  }

  // Страница "Добавление": /02-dobavlenie
  @Get('02-dobavlenie')
  @Render('draft-form')
  showDraft() {
    const draft = this.accumulatorsService.findDraft();
    return { draft };
  }

  // Страница "Лента": /01-lenta/:id?next=true
  @Get('01-lenta/:id')
  @Render('feed')
  showFeed(@Param('id') id: string, @Query('next') next?: string) {
    const numericId = Number(id);
    const accumulator =
      next === 'true'
        ? this.accumulatorsService.findNextAfter(numericId)
        : this.accumulatorsService.findOnePublished(numericId);

    if (!accumulator) {
      throw new NotFoundException('Аккумулятор не найден или не опубликован');
    }
    return { accumulator };
  }

  // Тот же экран "Лента" без id — открывает первый опубликованный
  @Get('01-lenta')
  @Render('feed')
  showFeedDefault() {
    const accumulator = this.accumulatorsService.findNextAfter(0);
    return { accumulator };
  }

  // ---- Чистые JSON-эндпоинты (для вкладки Network на защите) ----

  @Get('api/accumulators')
  apiFindPublished(@Query('minCapacityMah') minCapacityMah?: string) {
    return this.accumulatorsService.findPublished(
      minCapacityMah ? Number(minCapacityMah) : undefined,
    );
  }

  @Get('api/accumulators/draft')
  apiFindDraft() {
    return this.accumulatorsService.findDraft();
  }

  @Get('api/accumulators/:id')
  apiFindOneOrNext(@Param('id') id: string, @Query('next') next?: string) {
    return next === 'true'
      ? this.accumulatorsService.findNextAfter(Number(id))
      : this.accumulatorsService.findOnePublished(Number(id));
  }
}
