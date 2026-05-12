export type RawUserSeed = {
  name: string;
  email: string;
  password: string;
  bio: string;
  profilePicture?: string;
};

export type FriendRequestStatusSeed = 'pending' | 'accepted' | 'rejected';

export type RawFriendRequestSeed = {
  senderEmail: string;
  receiverEmail: string;
  status: FriendRequestStatusSeed;
};

export const rawUsers: RawUserSeed[] = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    bio: 'Software engineer',
    profilePicture: '',
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
    bio: 'Product designer',
  },
  {
    name: 'Carol White',
    email: 'carol@example.com',
    password: 'password123',
    bio: 'Data scientist',
  },
  {
    name: 'David Brown',
    email: 'david@example.com',
    password: 'password123',
    bio: 'DevOps engineer',
  },
  {
    name: 'Eva Martinez',
    email: 'eva@example.com',
    password: 'password123',
    bio: 'Mobile developer',
  },
  {
    name: 'Frank Lee',
    email: 'frank@example.com',
    password: 'password123',
    bio: 'Backend developer',
  },
  {
    name: 'Grace Kim',
    email: 'grace@example.com',
    password: 'password123',
    bio: 'UX researcher',
  },
  {
    name: 'Henry Wilson',
    email: 'henry@example.com',
    password: 'password123',
    bio: 'Full stack developer',
  },
  {
    name: 'Iris Chen',
    email: 'iris@example.com',
    password: 'password123',
    bio: 'Security engineer',
  },
  {
    name: 'Jack Taylor',
    email: 'jack@example.com',
    password: 'password123',
    bio: 'ML engineer',
  },
];

export const rawFriendRequests: RawFriendRequestSeed[] = [
  {
    senderEmail: 'alice@example.com',
    receiverEmail: 'bob@example.com',
    status: 'accepted',
  },
  {
    senderEmail: 'alice@example.com',
    receiverEmail: 'carol@example.com',
    status: 'accepted',
  },
  {
    senderEmail: 'bob@example.com',
    receiverEmail: 'david@example.com',
    status: 'accepted',
  },
  {
    senderEmail: 'carol@example.com',
    receiverEmail: 'eva@example.com',
    status: 'accepted',
  },
  {
    senderEmail: 'frank@example.com',
    receiverEmail: 'grace@example.com',
    status: 'accepted',
  },
  {
    senderEmail: 'henry@example.com',
    receiverEmail: 'iris@example.com',
    status: 'accepted',
  },
  {
    senderEmail: 'david@example.com',
    receiverEmail: 'alice@example.com',
    status: 'pending',
  },
  {
    senderEmail: 'eva@example.com',
    receiverEmail: 'bob@example.com',
    status: 'pending',
  },
  {
    senderEmail: 'jack@example.com',
    receiverEmail: 'carol@example.com',
    status: 'pending',
  },
  {
    senderEmail: 'grace@example.com',
    receiverEmail: 'henry@example.com',
    status: 'pending',
  },
  {
    senderEmail: 'iris@example.com',
    receiverEmail: 'jack@example.com',
    status: 'rejected',
  },
  {
    senderEmail: 'frank@example.com',
    receiverEmail: 'alice@example.com',
    status: 'rejected',
  },
];
