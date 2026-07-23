import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { Order, OrderStatus } from '../modules/orders/order.entity';

@Injectable()
export class PaymentConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentConsumerService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private readonly exchange = 'hgm';
  private readonly queue = 'payment.confirmed.sysA';
  private readonly routingKey = 'payment.confirmed';

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async onModuleInit() {
    await this.connectAndConsume();
  }

  private async connectAndConsume() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Assert Exchange, Queue, and Bind
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.assertQueue(this.queue, { durable: true });
      await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

      this.logger.log(`Subscribed to queue: ${this.queue}`);

      // Consume Messages
      await this.channel.consume(this.queue, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`Received payment event: ${JSON.stringify(content)}`);

          const orderId = content.orderId;
          if (orderId) {
            // Directly update order status to CONFIRMED (bypassing state machine)
            await this.orderRepository.update(orderId, {
              status: OrderStatus.CONFIRMED,
            });
            this.logger.log(`Order ${orderId} updated to CONFIRMED via Payment Consumer`);
          }

          // ACK on success
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing payment message: ${error.message}`);
          // NACK + requeue on error
          this.channel.nack(msg, false, true);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ consumer: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}