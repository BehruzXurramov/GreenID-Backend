import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserResponseDto, UserSummaryDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

type CreateGoogleUserInput = {
  googleId: string;
  email: string;
  name: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createFromGoogle(input: CreateGoogleUserInput): Promise<User> {
    const user = this.usersRepository.create({
      googleId: input.googleId,
      email: input.email,
      name: input.name,
    });
    return this.usersRepository.save(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.findByIdOrFail(userId);
    return this.toResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.toResponseDto(user));
  }

  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  toSummaryDto(user: User): UserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
    };
  }
}
