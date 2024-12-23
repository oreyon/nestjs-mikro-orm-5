import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest, RegisterResponse } from './dto/register-auth.dto';
import { WebResponse } from '../model/web.model';
import { Request, Response } from 'express';
import {
  EmailVerificationRequest,
  EmailVerificationResponse,
} from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(201)
  @Post('/register')
  async register(
    @Body() request: RegisterRequest,
  ): Promise<WebResponse<RegisterResponse>> {
    const result = await this.authService.register(request);

    return {
      code: HttpStatus.CREATED,
      status: 'User successfully registered',
      data: result,
    };
  }

  @HttpCode(200)
  @Post('/verify-email')
  async verifyEmail(
    @Body() request: EmailVerificationRequest,
  ): Promise<WebResponse<EmailVerificationResponse>> {
    const result = await this.authService.verifyEmail(request);

    return {
      code: HttpStatus.OK,
      status: 'Email successfully verified',
      data: result,
    };
  }
}
