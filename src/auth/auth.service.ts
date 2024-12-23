import { HttpException, Inject, Injectable } from '@nestjs/common';
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
import { Role, User } from './entities/user.entity';
import { AuthValidation } from './auth.validation';
import {
  EmailVerificationRequest,
  EmailVerificationResponse,
} from './dto/verify-email.dto';

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

    const isFirstAccount: boolean = (await this.userRepository.count()) === 0;
    const role: Role = isFirstAccount ? Role.ADMIN : Role.USER;

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
      role: role,
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

  async verifyEmail(
    request: EmailVerificationRequest,
  ): Promise<EmailVerificationResponse> {
    this.logger.debug(`VERIFY EMAIL : ${JSON.stringify(request)}`);

    const verifyEmailRequest: EmailVerificationRequest =
      this.validationService.validate(
        AuthValidation.EMAIL_VERIFICATION,
        request,
      );

    const user = await this.userRepository.findOne({
      email: verifyEmailRequest.email,
    });

    if (!user) {
      throw new HttpException('Invalid email address', 400);
    }

    if (
      verifyEmailRequest.emailVerificationToken !== user.emailVerificationToken
    ) {
      throw new HttpException('Invalid token', 400);
    }

    user.isVerified = true;
    user.verifiedTime = new Date();
    user.emailVerificationToken = '';

    await this.em.flush();

    return {
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      verifiedTime: user.verifiedTime,
    };
  }
}
