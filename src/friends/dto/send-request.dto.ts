import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class SendRequestDto {
  @ApiProperty({
    example: '64a1b2c3d4e5f67890123456',
    description: 'MongoDB ObjectId of receiver',
  })
  @IsMongoId()
  receiverId: string;
}
