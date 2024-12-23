import { HttpException, Inject, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { RegisterRequest, RegisterResponse } from './dto/register-auth.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from '../common/validation.service';
import { EntityManager } from '@mikro-orm/mysql';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NodemailerService } from '../nodemailer/nodemailer.service';
import { UserRepository } from './user.repository';
import { v7 as uuidv7 } from 'uuid';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TokensResponse } from '../model/tokens.model';
import { User } from './entities/user.entity';
import { AuthValidation } from './auth.validation';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private em: EntityManager,
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private nodemailerService: NodemailerService,
  ) {}

  async create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  async findAll() {
    return `This action returns all auth`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  async update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  async remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    this.logger.debug(`REGISTER USER: ${JSON.stringify(request)}`);

    const registerRequest: RegisterRequest = this.validationService.validate(
      AuthValidation.REGISTER,
      request,
    );

    // check if email already exist
    const emailAlreadyExists = await this.userRepository.findOne({
      email: registerRequest.email,
    });

    if (emailAlreadyExists) {
      throw new HttpException('Email already exists', 400);
    }

    const usernameAlreadyExists = await this.userRepository.count({
      username: registerRequest.username,
    });

    if (usernameAlreadyExists > 0) {
      throw new HttpException('Username already exists', 400);
    }

    // if env development secret token is secret, env production will generate random token
    const emailVerificationToken =
      this.configService.get('NODE_ENV') === 'development'
        ? 'secret'
        : crypto.randomBytes(40).toLocaleString('hex');

    // hash password
    registerRequest.password = await argon2.hash(registerRequest.password);

    const user: User = this.userRepository.create({
      email: registerRequest.email,
      username: registerRequest.username,
      password: registerRequest.password,
      emailVerificationToken: emailVerificationToken,
    });

    await this.em.persistAndFlush(user);

    // front-end url origin
    const frontEndOrigin = this.configService.get('IP_FRONTEND_ORIGIN');

    // send email verification
    await this.nodemailerService.sendVerificationEmail({
      email: user.email,
      name: user.username,
      verificationToken: user.emailVerificationToken,
      origin: frontEndOrigin,
    });

    return {
      email: user.email,
      username: user.username,
      emailVerificationToken: user.emailVerificationToken,
    };
  }

  async createTokens(userId: number): Promise<TokensResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          jti: uuidv7(),
          sub: userId,
          iat: Math.floor(Date.now() / 1000),
        },
        {
          secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: 60 * 2,
        },
      ),
      this.jwtService.signAsync(
        {
          jti: uuidv7(),
          sub: userId,
          iat: Math.floor(Date.now() / 1000),
        },
        {
          secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: 60 * 60 * 24,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async createAccessToken(userId: number): Promise<string> {
    return await this.jwtService.signAsync(
      {
        jti: uuidv7(),
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
      },
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: 60 * 2,
      },
    );
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashRefreshToken = await bcrypt.hash(refreshToken, 10);
    // const hashRefreshToken = await argon2.hash(refreshToken);
    const user = await this.userRepository.findOne(userId);
    user.refreshToken = hashRefreshToken;
    await this.em.flush();
  }
}
