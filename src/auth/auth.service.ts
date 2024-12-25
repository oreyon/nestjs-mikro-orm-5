import { HttpException, Inject, Injectable } from '@nestjs/common';
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
import { Response } from 'express';
import { JwtPayload } from '../common/strategies';
import {
  CurrentUserResponse,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from './dto/auth.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

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
    private cloudinaryService: CloudinaryService,
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

  async login(
    request: LoginRequest,
    response: Response,
  ): Promise<LoginResponse> {
    this.logger.debug(`LOGIN USER: ${JSON.stringify(request)}`);

    const loginRequest: LoginRequest = this.validationService.validate(
      AuthValidation.LOGIN,
      request,
    );

    const user: User = await this.userRepository.findOne({
      email: loginRequest.email,
    });

    if (!user) throw new HttpException('Invalid email or password', 400);
    if (!user.isVerified) throw new HttpException('Email is not verified', 401);

    const isPasswordValid = await argon2.verify(
      user.password,
      loginRequest.password,
    );

    if (!isPasswordValid)
      throw new HttpException(`Invalid email or password`, 400);

    const tokens: TokensResponse = await this.createTokens(user.id);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    response.cookie('accesstoken', tokens.accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'none',
      signed: true,
    });

    response.cookie('refreshtoken', tokens.refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'none',
      signed: true,
    });

    return {
      email: user.email,
      username: user.username,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getCurrentUser(user: User): Promise<CurrentUserResponse> {
    this.logger.debug(`GET CURRENT USER: ${JSON.stringify(user)}`);

    return {
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  async logout(user: User, response: Response): Promise<boolean> {
    this.logger.debug(`LOGOUT USER: ${JSON.stringify(user)}`);

    const userLogin = await this.userRepository.findOne(user.id);
    userLogin.refreshToken = '';
    await this.em.flush();

    response.clearCookie('accesstoken');
    response.clearCookie('refreshtoken');

    return true;
  }

  async refreshToken(
    refreshToken: string,
    response: Response,
  ): Promise<RefreshTokenResponse> {
    this.logger.debug(`REFRESH TOKEN: ${refreshToken}`);

    // validate refresh token
    const validRefreshToken = this.validationService.validate(
      AuthValidation.REFRESH_TOKEN,
      refreshToken,
    );
    if (!validRefreshToken)
      throw new HttpException('Invalid refresh token', 400);

    // decode refresh token
    const decodedToken = this.jwtService.decode(refreshToken) as JwtPayload;
    const userId = decodedToken.sub;
    if (!userId) throw new HttpException('Invalid refresh token', 400);

    // find user by id
    const user = await this.userRepository.findOne(userId);
    if (!user || !user.refreshToken)
      throw new HttpException('Invalid refresh token', 400);

    // compare refresh token with hash token in database
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid)
      throw new HttpException('Invalid refresh token', 400);

    // generate new access token
    const newAccessToken = await this.createAccessToken(user.id);

    // Set the new access token in a secure HTTP-only cookie
    response.cookie('accesstoken', newAccessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'none',
      signed: true,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: user.refreshToken,
    };
  }

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    this.logger.debug(`FORGOT PASSWORD: ${JSON.stringify(request)}`);

    const forgotPassword: ForgotPasswordResponse =
      this.validationService.validate(AuthValidation.FORGOT_PASSWORD, request);

    const user = await this.userRepository.findOne({
      email: forgotPassword.email,
    });
    if (!user) throw new HttpException('Invalid email address', 400);
    if (!user.isVerified) throw new HttpException('Email is not verified', 401);

    const forgotToken =
      this.configService.get<string>('NODE_ENV') === 'development'
        ? 'secret'
        : crypto.randomBytes(40).toString('hex');
    const hashForgotToken = await argon2.hash(forgotToken);

    const frontEndOrigin = this.configService.get<string>('IP_FRONTEND_ORIGIN');
    await this.nodemailerService.sendResetPasswordEmail({
      email: user.email,
      name: user.username,
      token: forgotToken,
      origin: frontEndOrigin,
    });

    const expirationTime = new Date(Date.now() + 30 * 1000);

    user.passwordResetToken = hashForgotToken;
    user.passwordResetTokenExpirationTime = expirationTime;
    await this.em.flush();

    return {
      email: user.email,
      passwordResetToken: user.passwordResetToken,
    };
  }

  async resetPassword(
    request: ResetPasswordRequest,
    response: Response,
  ): Promise<ResetPasswordResponse> {
    this.logger.debug(`RESET PASSWORD: ${JSON.stringify(request)}`);

    const resetRequest: ResetPasswordRequest = this.validationService.validate(
      AuthValidation.RESET_PASSWORD,
      request,
    );

    const user = await this.userRepository.findOne({
      email: resetRequest.email,
    });
    if (!user || !user.passwordResetToken)
      throw new HttpException('Invalid user or reset token', 401);
    if (user.passwordResetTokenExpirationTime < new Date())
      throw new HttpException('Token expired', 401);

    const isTokenValid = await argon2.verify(
      user.passwordResetToken,
      resetRequest.resetPasswordToken,
    );
    if (!isTokenValid) throw new HttpException('Invalid reset token', 401);

    await this.em.transactional(async (em) => {
      user.password = await argon2.hash(resetRequest.newPassword);
      user.passwordResetToken = '';
      user.passwordResetTokenExpirationTime = null;
      await em.flush();
    });

    response.clearCookie('accesstoken');
    response.clearCookie('refreshtoken');

    return {
      email: user.email,
      username: user.username,
    };
  }

  async uploadImage(user: User, file: Express.Multer.File) {
    this.logger.debug(`UPLOAD AVATAR: ${JSON.stringify(file)}`);
    this.logger.debug(`File size: ${file?.size}`);
    this.logger.debug(`File mimetype: ${file?.mimetype}`);

    this.validationService.validate(AuthValidation.UPLOAD_IMAGE, {
      image: file,
    });

    const userLogin = await this.userRepository.findOne(user.id);

    if (userLogin.image) {
      const publicId = this.extractPublicId(userLogin.image);
      await this.cloudinaryService.deleteImage(publicId);
    }

    const result = await this.cloudinaryService.uploadImage(file);
    userLogin.image = result.secure_url;
    await this.em.flush();

    return {
      imageId: result.public_id,
      size: result.bytes / 1000,
      format: result.format,
      imageUrl: result.url,
      imageSecureUrl: result.secure_url,
      createdAt: result.created_at,
    };
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const fileName = parts.pop() || ''; // Get the last part of the URL
    return fileName.split('.')[0]; // Remove the file extension
  }

  /*async uploadImageLocal(user: User, file: Express.Multer.File) {
    this.logger.debug(`UPLOAD AVATAR: ${JSON.stringify(file)}`);
    this.logger.debug(`File size: ${file?.size}`);
    this.logger.debug(`File mimetype: ${file?.mimetype}`);

    this.validationService.validate(AuthValidation.UPLOAD_IMAGE, {
      image: file,
    });

    const userLogin = await this.userRepository.findOne(user.id);

    return {
      imageId: result.public_id,
      size: result.bytes / 1000,
      format: result.format,
      imageUrl: result.url,
      imageSecureUrl: result.secure_url,
      createdAt: result.created_at,
    };
  }*/
}
