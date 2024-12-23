import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh token of the user',
    format: 'text',
    minimum: 6,
    maximum: 255,
    example: 'JSONWebToken',
  })
  refreshToken: string;
}

export class RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
