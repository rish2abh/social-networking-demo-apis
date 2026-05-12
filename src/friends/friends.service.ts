import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FriendRequest,
  FriendRequestDocument,
  FriendRequestStatus,
} from './schemas/friend-request.schema';
import { FriendQueryDto } from './dto/friend-query.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { SendRequestDto } from './dto/send-request.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class FriendsService {
  constructor(
    private readonly logger: LoggerService,
    @InjectModel(FriendRequest.name)
    private friendRequestModel: Model<FriendRequestDocument>,
    private readonly usersService: UsersService,
  ) {
    this.logger.setContext('FriendsService');
  }

  async sendRequest(senderId: string, dto: SendRequestDto) {
    this.logger.log('Sending friend request', {
      senderId,
      receiverId: dto.receiverId,
    });

    if (!Types.ObjectId.isValid(dto.receiverId)) {
      throw new BadRequestException('Invalid receiverId');
    }

    if (senderId === dto.receiverId) {
      this.logger.warn('Friend request to self rejected', {
        userId: senderId,
      });
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    await this.usersService.findById(dto.receiverId);

    const exists = await this.friendRequestModel
      .findOne({
        $or: [
          { sender: senderId, receiver: dto.receiverId },
          { sender: dto.receiverId, receiver: senderId },
        ],
      })
      .exec();

    if (exists) {
      this.logger.warn('Duplicate friend request blocked', {
        senderId,
        receiverId: dto.receiverId,
      });
      throw new ConflictException(
        'Friend request already exists or you are already friends',
      );
    }

    const request = new this.friendRequestModel({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(dto.receiverId),
    });

    const result = await request.save();

    this.logger.log('Friend request sent', {
      requestId: String(result._id),
      senderId,
      receiverId: dto.receiverId,
    });

    return result;
  }

  async listFriends(userId: string, query: FriendQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const validSortFields = ['name', 'createdAt'] as const;
    let sortBy = query.sortBy || 'createdAt';
    let order = query.order || 'desc';

    if (query.sort) {
      const rawSort = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
      const normalizedSort = rawSort as (typeof validSortFields)[number];
      if (!validSortFields.includes(normalizedSort)) {
        throw new BadRequestException(
          `Invalid sort value. Expected one of: ${validSortFields.join(', ')}, -${validSortFields.join(', -')}`,
        );
      }
      sortBy = normalizedSort;
      order = query.sort.startsWith('-') ? 'desc' : 'asc';
    }

    if (!validSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Invalid sortBy value. Expected one of: ${validSortFields.join(', ')}`,
      );
    }

    const requests = await this.friendRequestModel
      .find({
        status: FriendRequestStatus.Accepted,
        $or: [{ sender: userId }, { receiver: userId }],
      })
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture')
      .exec();

    let friends = requests.map((request: any) =>
      request.sender._id.toString() === userId
        ? request.receiver
        : request.sender,
    );

    if (query.name) {
      const nameRegex = new RegExp(query.name, 'i');
      friends = friends.filter((friend: any) => nameRegex.test(friend.name));
    }

    const sortDirection = order === 'desc' ? -1 : 1;

    friends.sort((a: any, b: any) => {
      if (sortBy === 'createdAt') {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();
        return (left - right) * sortDirection;
      }
      const left = a[sortBy]?.toString() || '';
      const right = b[sortBy]?.toString() || '';
      return left.localeCompare(right) * sortDirection;
    });

    const total = friends.length;
    const skip = (page - 1) * limit;
    const data = friends.slice(skip, skip + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listIncomingRequests(userId: string, query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const filter = {
      receiver: userId,
      status: FriendRequestStatus.Pending,
    };

    const [data, total] = await Promise.all([
      this.friendRequestModel
        .find(filter)
        .populate('sender', 'name email profilePicture')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.friendRequestModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async respondToRequest(
    userId: string,
    requestId: string,
    dto: RespondRequestDto,
  ) {
    this.logger.log('Responding to friend request', {
      requestId,
      userId,
      action: dto.status,
    });

    if (!Types.ObjectId.isValid(requestId)) {
      throw new BadRequestException('Invalid requestId');
    }

    const request = await this.friendRequestModel
      .findById(requestId)
      .exec();

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiver.toString() !== userId) {
      this.logger.warn('Unauthorized response attempt', {
        requestId,
        userId,
      });
      throw new ForbiddenException('Not authorized');
    }

    if (request.status !== FriendRequestStatus.Pending) {
      throw new BadRequestException('Request already actioned');
    }

    request.status = dto.status;
    const result = await request.save();

    this.logger.log('Friend request updated', {
      requestId,
      status: dto.status,
    });

    return result;
  }
}
