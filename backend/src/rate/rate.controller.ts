import { Controller, Get } from '@nestjs/common';
import { RateService } from './rate.service';

@Controller('rate')
export class RateController {
  constructor(private readonly rateService: RateService) {}

  // Público: el frontend lo lee para mostrar precios en Bs.
  @Get()
  get() {
    return this.rateService.getRate();
  }
}
