import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendWhatsAppMessageDto {
  @ApiProperty({ example: 'customer-or-phone-conversation-id' })
  @IsString()
  conversationId!: string;

  @ApiProperty({ example: 'Olá! Posso te ajudar com esse orçamento.' })
  @IsString()
  @MinLength(1)
  body!: string;
}
