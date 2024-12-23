import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { NodemailerModule } from '../nodemailer/nodemailer.module';

@Module({
  imports: [
    JwtModule.register({}),
    MikroOrmModule.forFeature([User]),
    NodemailerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}