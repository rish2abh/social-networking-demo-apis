import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: LoggerService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.logger.setContext('UsersService');
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    this.logger.debug('Creating user', { email: createUserDto.email });

    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();

    if (existingUser) {
      this.logger.warn('User creation blocked — email already exists', {
        email: createUserDto.email,
      });
      throw new ConflictException('Email already registered');
    }

    const user = await this.userModel.create(createUserDto);

    this.logger.debug('User created', {
      userId: String(user._id),
      email: user.email,
    });

    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    this.logger.debug('Listing users');
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    this.logger.debug('Finding user by id', { userId: id });

    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      this.logger.warn('User not found', { userId: id });
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    this.logger.debug('Finding user by email', { email });
    return this.userModel.findOne({ email }).select('+password').exec();
  }
}
