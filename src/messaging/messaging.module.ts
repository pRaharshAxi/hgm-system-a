import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventPublisherService } from './event-publisher.service';
import { PaymentConsumerService } from './payment-consumer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../modules/orders/order.entity';

@Global() // Makes the publisher accessible across the app without re-importing
@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),

    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
          queueOptions: {
            durable: true,
          },
          // Setting up the topic exchange configuration
          socketOptions: {
            heartbeatIntervalInSeconds: 60,
          },
        },
      },
    ]),
  ],
  providers: [EventPublisherService, PaymentConsumerService],
  exports: [EventPublisherService],
})
export class MessagingModule {}