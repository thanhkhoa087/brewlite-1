import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async checkHealth(@Res() res: Response) {
    let dbStatus = 'up';
    try {
      // Simple ping to database
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'degraded_or_unreachable';
    }

    const healthData = {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      info: {
        database: {
          status: dbStatus,
        },
        service: 'brewlite-api',
        version: '1.0.0',
      },
    };

    return res.status(HttpStatus.OK).json(healthData);
  }
}
