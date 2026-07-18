import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tasa oficial del dólar (BCV) vía DolarAPI Venezuela.
 * Los precios se guardan en USD y el frontend calcula los Bs con esta tasa.
 * - Refresca cada 6h. Si la API falla, conserva la última tasa conocida (no rompe la web).
 * - Cachea en la tabla `settings` para sobrevivir reinicios del servidor.
 */
@Injectable()
export class RateService implements OnModuleInit {
  private readonly logger = new Logger('RateService');
  private readonly API_URL =
    process.env.BCV_API_URL || 'https://ve.dolarapi.com/v1/dolares/oficial';
  private readonly REFRESH_MS = 6 * 60 * 60 * 1000; // 6 horas

  private cache: { rate: number | null; date: string | null; source: string } = {
    rate: null,
    date: null,
    source: 'BCV',
  };

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadFromDB(); // arranca con la última tasa guardada
    await this.refresh(); // intenta actualizar de una
    setInterval(() => this.refresh(), this.REFRESH_MS);
  }

  getRate() {
    return this.cache;
  }

  async refresh() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // corta a los 10s
    try {
      const res = await fetch(this.API_URL, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: any = await res.json();
      const value = Number(data.promedio ?? data.venta);
      if (!value || value <= 0) throw new Error('Tasa inválida');
      this.cache.rate = value;
      this.cache.date = String(data.fechaActualizacion).slice(0, 10);
      await this.saveToDB();
      this.logger.log(`Tasa BCV actualizada: ${value} (${this.cache.date})`);
    } catch (err: any) {
      this.logger.warn(
        `No se pudo actualizar la tasa: ${err.message}. Se usa la última conocida (${this.cache.rate}).`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async loadFromDB() {
    try {
      const row = await this.prisma.setting.findUnique({ where: { key: 'bcv_rate' } });
      if (row?.value) {
        const parsed = JSON.parse(row.value);
        this.cache.rate = parsed.rate ?? null;
        this.cache.date = parsed.date ?? null;
      }
    } catch {
      /* la tabla puede no existir todavía en el primer arranque; no pasa nada */
    }
  }

  private async saveToDB() {
    const value = JSON.stringify({
      rate: this.cache.rate,
      date: this.cache.date,
      source: this.cache.source,
    });
    await this.prisma.setting.upsert({
      where: { key: 'bcv_rate' },
      update: { value },
      create: { key: 'bcv_rate', value },
    });
  }
}
