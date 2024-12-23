import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/user.entity';

export class EmailVerificationRequest {
  @ApiProperty({
    description: 'Email address of the user',
    format: 'email',
    minimum: 6,
    maximum: 100,
    example: 'example@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Token verification email',
    format: 'text',
    minimum: 6,
    maximum: 100,
    example: 'secret',
  })
  emailVerificationToken: string;
}

export class EmailVerificationResponse {
  email: string;
  role?: Role;
  isVerified?: boolean;
  verifiedTime?: Date;
}
