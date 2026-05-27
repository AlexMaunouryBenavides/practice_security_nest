import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SignInDto } from 'src/auth/dto/sign-in.dto';
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

    return this.userRepository.save(newUser);
  }

  async findAll() {
    const cachedUsers= await this.cacheManager.get<User[]>('users');
    console.log('cache =>', cachedUsers);
    if(!cachedUsers){
      const allUser= await this.userRepository.find();
      await this.cacheManager.set('users', allUser, 10000);
      return allUser;
    }
    return cachedUsers;
  }




  findOne(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update({ id }, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete({ id });
  }

  async readOneByEmail(data: SignInDto) {
    return this.userRepository.findOneBy({ email: data.email });
  }
}
