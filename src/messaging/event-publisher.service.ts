import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.AmqpConnectionManager | null = null;
  private channelWrapper: amqp.ChannelWrapper | null = null;

  async onModuleInit() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

    try {
      this.logger.log('Connecting to RabbitMQ...');

      // 1. Establish direct connection manager pool
      this.connection = amqp.connect([rabbitUrl]);

      // 2. Create and configure the channel wrapper
      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: any) => {
          // Assert the custom hgm topic exchange explicitly
          await channel.assertExchange('hgm', 'topic', { durable: true });
        },
      });

      this.logger.log('Successfully connected to RabbitMQ and declared "hgm" exchange.');
    } catch (error: any) {
      this.logger.error(`Failed to initialize RabbitMQ connection: ${error?.message || error}`);
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publishListingCreated(payload: any) {
    await this.safeEmit('listing.created', payload);
  }

  async publishListingUpdated(payload: any) {
    await this.safeEmit('listing.updated', payload);
  }

  async publishListingDeleted(id: string) {
    await this.safeEmit('listing.deleted', { id });
  }

  async publishOrderPlaced(payload: any) {
    await this.safeEmit('order.placed', payload);
  }

  async publishOrderStatusUpdated(payload: any) {
    await this.safeEmit('order.status.updated', payload);
  }

  /**
   * Helper method to safely publish events directly to the 'hgm' topic exchange
   */
  private async safeEmit(routingKey: string, data: any) {
    try {
      if (this.channelWrapper) {
        // Publish natively straight into your custom exchange
        await this.channelWrapper.publish('hgm', routingKey, data);
        this.logger.log(`Successfully published event to exchange hgm with key: ${routingKey}`);
      } else {
        throw new Error('RabbitMQ channel wrapper is not initialized');
      }
    } catch (error: any) {
      this.logger.warn(
        `RabbitMQ Event Dispatched Failed for [${routingKey}]: ${error?.message || error}. Proceeding safely.`,
      );
    }
  }
}