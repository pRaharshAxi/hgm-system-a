import { Controller, Get, Header, Inject, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly entityManager: EntityManager,
    @Optional() @Inject('RABBITMQ_SERVICE') private readonly clientProxy?: ClientProxy,
  ) {}

  @Get('health')
  async checkHealth() {
    // 1. Check Database
    let dbStatus = 'disconnected';
    try {
      await this.entityManager.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    // 2. Check RabbitMQ Broker
    let brokerStatus = 'disconnected';
    try {
      if (this.clientProxy) {
        brokerStatus = 'connected';
      }
    } catch {
      brokerStatus = 'disconnected';
    }

    return {
      status: 'ok',
      db: dbStatus,
      broker: brokerStatus,
      timestamp: Date.now(),
    };
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.appService.getMetrics();
  }
}