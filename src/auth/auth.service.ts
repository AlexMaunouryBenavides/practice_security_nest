
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UserService) { }

    async signIn(data: User): Promise<any> {
        const user = await this.usersService.readOneByEmail(data);
        if (user?.password !== data.password) {
            throw new UnauthorizedException();
        }

        const isMatch = await bcrypt.compare(data.password, user.password);
        
        if(!isMatch){
            throw new UnauthorizedException();
        }

        return user;
    }
}
