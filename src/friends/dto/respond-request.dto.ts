import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class RespondRequestDto {
  @ApiProperty({
    enum: ['accepted', 'rejected'],
    description: 'Action on the request',
  })
  @IsEnum(['accepted', 'rejected'])
  status: string;
}
