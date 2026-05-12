import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FriendQueryDto } from './dto/friend-query.dto';
import { PaginationDto } from './dto/pagination.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { SendRequestDto } from './dto/send-request.dto';
import { FriendsService } from './friends.service';

type CurrentUserPayload = {
  id: string;
  email: string;
};

@ApiTags('Friends')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('friend')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, description: 'Friend request sent' })
  @ApiResponse({
    status: 400,
    description: 'Cannot send to yourself / invalid ID',
  })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  @ApiResponse({ status: 409, description: 'Request already exists' })
  sendRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() sendRequestDto: SendRequestDto,
  ) {
    return this.friendsService.sendRequest(user.id, sendRequestDto);
  }

  @Get('friends')
  @ApiOperation({
    summary: 'List accepted friends with pagination, filtering, sorting',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt'],
    description: 'Field used to sort friend results',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction for the selected field',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['name', '-name', 'createdAt', '-createdAt'],
    description:
      'Legacy sort syntax. Prefer sortBy + order, but this is still accepted for backward compatibility.',
  })
  @ApiResponse({ status: 200, description: 'Paginated friends list' })
  listFriends(
    @CurrentUser() user: CurrentUserPayload,
    @Query() friendQueryDto: FriendQueryDto,
  ) {
    return this.friendsService.listFriends(user.id, friendQueryDto);
  }

  @Get('friends-request')
  @ApiOperation({ summary: 'List all incoming pending friend requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated incoming requests' })
  listRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.friendsService.listIncomingRequests(user.id, paginationDto);
  }

  @Put('friends-request/:id')
  @ApiOperation({ summary: 'Accept or reject a friend request' })
  @ApiParam({ name: 'id', description: 'FriendRequest MongoDB ObjectId' })
  @ApiBody({ type: RespondRequestDto })
  @ApiResponse({ status: 200, description: 'Request updated' })
  @ApiResponse({
    status: 400,
    description: 'Already actioned / invalid ID / bad status',
  })
  @ApiResponse({
    status: 403,
    description: 'Not the receiver of this request',
  })
  @ApiResponse({ status: 404, description: 'Request not found' })
  respondToRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() respondRequestDto: RespondRequestDto,
  ) {
    return this.friendsService.respondToRequest(
      user.id,
      id,
      respondRequestDto,
    );
  }
}
