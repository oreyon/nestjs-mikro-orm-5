import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequest {
  @ApiProperty({
    description: 'Email address of the user',
    format: 'email',
    minimum: 6,
    maximum: 100,
    example: 'example@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'New password of the user',
    format: 'text',
    minimum: 6,
    maximum: 100,
    example: 'updatedexamplepassword',
  })
  newPassword: string;

  @ApiProperty({
    description: 'New password of the user',
    format: 'text',
    minimum: 6,
    maximum: 100,
    example: 'updatedexamplepassword',
  })
  repeatNewPassword: string;

  @ApiProperty({
    description: 'Reset password token',
    format: 'text',
    minimum: 6,
    maximum: 100,
    example: 'secret',
  })
  resetPasswordToken: string;
}

export class ResetPasswordResponse {
  email: string;
  username: string;
}
