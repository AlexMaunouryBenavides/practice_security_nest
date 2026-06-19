import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SignInDto } from '../auth/dto/sign-in.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async createUser(createUserDto: CreateUserDto) {
    const salt = 10;
    const password = createUserDto.password;
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = {
      ...createUserDto,
      password: hashPassword,
    };
    await this.cacheManager.del('users');

    return this.userRepository.save(newUser);
  }

  private toPublicUser(user: User): Omit<User, 'password'> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async findAll() {
    const cachedUsers =
      await this.cacheManager.get<Omit<User, 'password'>[]>('users');
    if (!cachedUsers) {
      const allUser = await this.userRepository.find();
      const sanitized = allUser.map((user) => this.toPublicUser(user));
      await this.cacheManager.set('users', sanitized, 1000 * 60 * 60);
      return sanitized;
    }
    return cachedUsers;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      return null;
    }
    return this.toPublicUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.cacheManager.del('users');
    return this.userRepository.update({ id }, updateUserDto);
  }

  async remove(id: number) {
    await this.cacheManager.del('users');
    return this.userRepository.delete({ id });
  }

  async readOneByEmail(data: SignInDto) {
    return this.userRepository.findOneBy({ email: data.email });
  }
}
