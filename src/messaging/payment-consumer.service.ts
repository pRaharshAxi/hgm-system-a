import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as amqp from 'amqplib';
import { Connection, Channel } from 'amqplib';
import { Order } from '../modules/orders/order.entity';
import { OrderStatus } from '../modules/orders/order.entity'; 

@Injectable()
export class PaymentConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentConsumerService.name);

  private connection: Connection |any;
  private channel: Channel |any;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async onModuleInit() {
    await this.initConsumer();
  }

  private async initConsumer() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();

      const exchangeName = 'hgm';
      const queueName = 'payment.confirmed.sysA';
      const routingKey = 'payment.confirmed';

      await this.channel.assertExchange(exchangeName, 'topic', { durable: true });
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(queueName, exchangeName, routingKey);

      await this.channel.prefetch(1);

      this.logger.log(`Listening on queue ${queueName} for key ${routingKey}`);

      this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`Received payment.confirmed payload: ${JSON.stringify(content)}`);

          const { orderId } = content;

          if (orderId) {
            // Update status bypassing the standard state machine checks
            await this.orderRepository.update(orderId, { status: OrderStatus.CONFIRMED });
            this.logger.log(`Order ${orderId} updated to CONFIRMED via Payment Consumer.`);
          }

          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing payment event: ${error.message}`, error.stack);
          // Requeue message on failure
          this.channel.nack(msg, false, true);
        }
      });
    } catch (err) {
      this.logger.error(`Failed to initialize RabbitMQ consumer: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}