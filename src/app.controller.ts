import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(
    private readonly entityManager: EntityManager,
    @Optional() @Inject('RABBITMQ_SERVICE') private readonly clientProxy?: ClientProxy,
  ) {}

  @Get()
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
      // Check if ClientProxy underlying connection/channel exists or ping
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
}