import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import mongoose, { Model, Types } from 'mongoose';
import {
  FriendRequest,
  FriendRequestDocument,
  FriendRequestSchema,
} from '../friends/schemas/friend-request.schema';
import {
  User,
  UserDocument,
  UserSchema,
} from '../users/schemas/user.schema';
import { rawFriendRequests, rawUsers } from './seed-data';

type SeedUserInsert = {
  name: string;
  email: string;
  password: string;
  bio: string;
  profilePicture: string;
};

type SeedFriendRequestInsert = {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: string;
};

const log = (message: string): void => {
  console.log(`[Seed] ${message}`);
};

const UserModel: Model<UserDocument> = mongoose.model<UserDocument>(
  User.name,
  UserSchema,
);

const FriendRequestModel: Model<FriendRequestDocument> =
  mongoose.model<FriendRequestDocument>(
    FriendRequest.name,
    FriendRequestSchema,
  );

const getMongoUri = (): string => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing from .env');
  }

  return mongoUri;
};

const buildSummary = (): string => {
  return [
    '┌─────────────────────────────────────────────────────┐',
    '│  Seed Summary                                       │',
    '├──────────────────────┬──────────────────────────────┤',
    '│  Users created       │  10                          │',
    '│  Accepted requests   │  6                           │',
    '│  Pending requests    │  4                           │',
    '│  Rejected requests   │  2                           │',
    '│  Total requests      │  12                          │',
    '├──────────────────────┴──────────────────────────────┤',
    '│  Login with any user: password123                   │',
    '│  Swagger UI: http://localhost:3000/api/docs          │',
    '└─────────────────────────────────────────────────────┘',
  ].join('\n');
};

const hashUsers = async (): Promise<SeedUserInsert[]> => {
  const hashedUsers: SeedUserInsert[] = [];

  for (let index = 0; index < rawUsers.length; index += 1) {
    log(`Hashing passwords... (${index + 1}/${rawUsers.length})`);
    const user = rawUsers[index];
    const password = await bcrypt.hash(user.password, 10);

    hashedUsers.push({
      name: user.name,
      email: user.email,
      password,
      bio: user.bio,
      profilePicture: user.profilePicture || '',
    });
  }

  return hashedUsers;
};

const createFriendRequests = (
  userIdsByEmail: Map<string, Types.ObjectId>,
): SeedFriendRequestInsert[] => {
  return rawFriendRequests.map((request) => {
    const sender = userIdsByEmail.get(request.senderEmail);
    const receiver = userIdsByEmail.get(request.receiverEmail);

    if (!sender || !receiver) {
      throw new Error(
        `Missing user for request ${request.senderEmail} -> ${request.receiverEmail}`,
      );
    }

    return {
      sender,
      receiver,
      status: request.status,
    };
  });
};

const seed = async (): Promise<void> => {
  try {
    log('Connecting to MongoDB...');
    await mongoose.connect(getMongoUri());
    log('Connected.');

    const [existingUsers, existingRequests] = await Promise.all([
      UserModel.countDocuments({}).exec(),
      FriendRequestModel.countDocuments({}).exec(),
    ]);

    log('Clearing existing data...');

    if (existingUsers > 0 || existingRequests > 0) {
      log(
        `Warning: found ${existingUsers} users and ${existingRequests} friend requests. Clearing them now.`,
      );
    }

    await Promise.all([
      FriendRequestModel.deleteMany({}).exec(),
      UserModel.deleteMany({}).exec(),
    ]);

    log(`Creating ${rawUsers.length} users...`);
    const usersToInsert = await hashUsers();
    const createdUsers = await UserModel.insertMany(usersToInsert);
    log('Users created.');

    const userIdsByEmail = new Map<string, Types.ObjectId>(
      createdUsers.map((user) => [
        user.email,
        new Types.ObjectId(String(user._id)),
      ]),
    );

    log(`Creating ${rawFriendRequests.length} friend requests...`);
    const friendRequestsToInsert = createFriendRequests(userIdsByEmail);
    await FriendRequestModel.insertMany(friendRequestsToInsert);

    log('Seed complete! Summary below:');
    console.log(buildSummary());

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Seed] Error: ${message}`);

    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  }
};

void seed();
