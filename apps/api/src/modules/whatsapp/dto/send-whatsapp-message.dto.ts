import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendWhatsAppMessageDto {
  @ApiProperty({ example: 'customer-or-phone-conversation-id' })
  @IsString()
  conversationId!: string;

  @ApiProperty({ example: 'Ola! Posso te ajudar com esse orcamento.' })
  @IsString()
  @MinLength(1)
  body!: string;
}
