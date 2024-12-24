import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { WebResponse } from '../model/web.model';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccessTokenGuard, RefreshTokenGuard } from '../common/guards';
import { UserData } from '../common/decorators';
import { User } from './entities/user.entity';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUpload } from '../common/decorators/file-upload.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a user' })
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

  @ApiOperation({ summary: 'Verify a user email user' })
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

  @ApiOperation({ summary: 'Login user' })
  @HttpCode(200)
  @Post('/login')
  async login(
    @Body() request: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WebResponse<LoginResponse>> {
    const result = await this.authService.login(request, response);
    return {
      code: HttpStatus.OK,
      status: 'User successfully logged in',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Get authenticated user' })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Get('/current')
  async getCurrentUser(
    @UserData() user: User,
  ): Promise<WebResponse<CurrentUserResponse>> {
    const result = await this.authService.getCurrentUser(user);
    return {
      code: HttpStatus.OK,
      status: 'User data successfully retrieved',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Delete('/logout')
  async logout(
    @UserData() user: User,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WebResponse<boolean>> {
    await this.authService.logout(user, response);
    return {
      code: HttpStatus.OK,
      status: 'User successfully logged out',
      data: true,
    };
  }

  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(200)
  @Post('/refresh-token')
  async refreshToken(
    @UserData('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WebResponse<RefreshTokenResponse>> {
    const result = await this.authService.refreshToken(refreshToken, response);

    return {
      code: HttpStatus.OK,
      status: 'Token successfully refreshed',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Forgot Password Via Email' })
  @HttpCode(200)
  @Post('/forgot-password')
  async forgotPassword(
    @Body() request: ForgotPasswordRequest,
  ): Promise<WebResponse<ForgotPasswordResponse>> {
    const result = await this.authService.forgotPassword(request);

    return {
      code: HttpStatus.OK,
      status: 'Reset password link sent to email',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Reset Password Via Email' })
  @HttpCode(200)
  @Post('/reset-password')
  async resetPassword(
    @Body() request: ResetPasswordRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WebResponse<ResetPasswordResponse>> {
    const result = await this.authService.resetPassword(request, response);
    return {
      code: HttpStatus.OK,
      status: 'Password successfully reset',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Upload Image to Cloud Storage' })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Post('/upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UserData() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.authService.uploadImage(user, file);

    return {
      code: HttpStatus.OK,
      status: 'Image successfully uploaded',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Upload Image to Local Server' })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @Post('/upload-local')
  @FileUpload()
  async uploadImageLocal(
    @UserData() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = {
      imageName: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      imageUrl: `${process.env.IP_BACKEND_ORIGIN}/api/v1/auth/${file.filename}`,
      createdAt: new Date(),
    };

    return {
      code: HttpStatus.OK,
      status: 'Image successfully uploaded',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Upload Multiple Image to Local Server' })
  @Post('/upload-multiple-local')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @HttpCode(200)
  @FileUpload(true) // Multiple files upload using the custom decorator
  async uploadMultipleImagesLocal(
    @UserData() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const result = files.map((file) => ({
      imageName: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      imageUrl: `${process.env.IP_BACKEND_ORIGIN}/api/v1/auth/${file.filename}`,
      createdAt: new Date(),
    }));

    return {
      code: HttpStatus.OK,
      status: 'Images successfully uploaded',
      data: result,
    };
  }

  @Get(':imgpath')
  seeUploadedFile(@Param('imgpath') image, @Res() res) {
    return res.sendFile(image, { root: './uploads' });
  }

  @Get('/check-ip')
  async checkIp(
    @Ip() ip: string, // Get the IP address
    @Headers('user-agent') userAgent: string, // Get the User-Agent header
    // @Req() request: Request, // Access the full request object if needed
  ) {
    console.log('IP Address:', ip);
    console.log('User-Agent:', userAgent);

    return {
      code: HttpStatus.OK,
      status: 'IP Address and User Agent successfully retrieved',
      data: {
        ipAddress: ip,
        userAgent: userAgent,
      },
    };
  }
}
