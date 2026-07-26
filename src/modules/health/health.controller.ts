import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly entityManager: EntityManager) {}

  @Get()
  async check() {
    let dbStatus = 'disconnected';
    try {
      // Execute a lightweight ping query to verify database connection
      await this.entityManager.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      db: dbStatus,
      broker: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}