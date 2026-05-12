import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('AuthService');
  }

  async register(registerDto: RegisterDto) {
    this.logger.log('Registering new user', { email: registerDto.email });

    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      this.logger.warn('Registration failed — email already exists', {
        email: registerDto.email,
      });
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.create(registerDto);

    this.logger.log('User registered successfully', {
      userId: String(user._id),
      email: user.email,
    });

    return {
      message: 'User registered successfully',
      data: this.toPublicUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.log('Login attempt', { email: loginDto.email });

    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      this.logger.warn('Login failed — invalid credentials', {
        email: loginDto.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await (
      user as typeof user & {
        comparePassword(candidate: string): Promise<boolean>;
      }
    ).comparePassword(loginDto.password);

    if (!isPasswordValid) {
      this.logger.warn('Login failed — invalid credentials', {
        email: loginDto.email,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log('User logged in successfully', {
      userId: String(user._id),
      email: user.email,
    });

    return {
      message: 'Login successful',
      data: {
        token: this.generateToken(user),
        tokenType: 'Bearer',
        user: this.toPublicUser(user),
      },
    };
  }

  private generateToken(user: UserDocument): string {
    return this.jwtService.sign(
      { sub: String(user._id), email: user.email },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn:
          (this.configService.get<string>('JWT_EXPIRES_IN') as StringValue) ||
          '7d',
      },
    );
  }

  private toPublicUser(user: UserDocument) {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
    };
  }
}
