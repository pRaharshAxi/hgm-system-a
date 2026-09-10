import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class AppService {
  private readonly register: client.Registry;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}