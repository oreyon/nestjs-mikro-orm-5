import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequest {
  @ApiProperty({
    description: 'Email address of the user',
    format: 'email',
    minimum: 6,
    maximum: 100,
    example: 'example@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    format: 'text',
    minimum: 6,
    maximum: 100,
    example: 'exapamplepassword',
  })
  password: string;

  @ApiProperty({
    description: 'Username of the user',
    format: 'text',
    minimum: 6,
    maximum: 100,
    example: 'examplename',
  })
  username: string;
}

export class RegisterResponse {
  email: string;
  username: string;
  emailVerificationToken: string;
}
