import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

const FRIEND_SORT_BY = ['name', 'createdAt'] as const;
const FRIEND_SORT_ORDER = ['asc', 'desc'] as const;

type FriendSortBy = (typeof FRIEND_SORT_BY)[number];
type FriendSortOrder = (typeof FRIEND_SORT_ORDER)[number];

export class FriendQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: FRIEND_SORT_BY,
    example: 'createdAt',
    description: 'Field used to sort friend results',
  })
  @IsOptional()
  @IsString()
  @IsIn(FRIEND_SORT_BY)
  sortBy?: FriendSortBy = 'createdAt';

  @ApiPropertyOptional({
    enum: FRIEND_SORT_ORDER,
    example: 'desc',
    description: 'Sort direction',
  })
  @IsOptional()
  @IsString()
  @IsIn(FRIEND_SORT_ORDER)
  order?: FriendSortOrder = 'desc';

  @ApiPropertyOptional({
    enum: ['name', '-name', 'createdAt', '-createdAt'],
    description:
      'Legacy sort syntax. Prefer sortBy + order, but this is still accepted for backward compatibility.',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}
