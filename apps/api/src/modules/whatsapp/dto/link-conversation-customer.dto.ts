import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LinkConversationCustomerDto {
  @ApiProperty({ example: 'clx_customer_id' })
  @IsString()
  customerId!: string;
}
