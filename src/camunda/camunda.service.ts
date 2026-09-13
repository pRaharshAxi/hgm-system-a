import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Camunda8 } from '@camunda8/sdk';
import * as path from 'path';

@Injectable()
export class CamundaService implements OnModuleInit, OnModuleDestroy {
  private readonly camunda = new Camunda8();
  private readonly zeebe = this.camunda.getZeebeGrpcApiClient();

  async onModuleInit() {
    const bpmnPath = path.join(
      process.cwd(),
      'src',
      'camunda',
      'bpmn',
      'order-process.bpmn',
    );

    await this.zeebe.deployResource({
      processFilename: bpmnPath,
    });

    console.log('Order process deployed to Camunda');
  }

  

  async startOrderProcess(
    orderId: string,
    buyerId: string,
    supplierId: string,
  ) {
    const result = await this.zeebe.createProcessInstance({
      bpmnProcessId: 'order-process',
      variables: {
        orderId,
        buyerId,
        supplierId,
      },
    });
  
    console.log(
      `Camunda process started | order=${orderId} | processInstanceKey=${result.processInstanceKey}`,
    );
  
    return result;
  }

  async onModuleDestroy() {
    await this.zeebe.close();
  }
}