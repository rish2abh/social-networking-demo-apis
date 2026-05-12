import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: '64a1b2c3d4e5f67890123456' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: '' })
  @Expose()
  profilePicture: string;

  @ApiProperty({ example: '' })
  @Expose()
  bio: string;

  @ApiProperty({ example: '2026-05-13T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @Exclude()
  password?: string;
}
