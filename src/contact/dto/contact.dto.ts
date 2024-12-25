import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContactRequest {
  @ApiProperty({
    description: 'First name of the contact',
    format: 'text',
    example: 'John',
  })
  firstName: string;

  @ApiPropertyOptional({
    description: 'Last name of the contact',
    format: 'text',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email of the contact',
    format: 'email',
    example: 'example@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the contact',
    format: 'text',
    example: '08123456789',
  })
  phone?: string;
}

export class CreateContactResponse {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export class GetContactResponse {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export class UpdateContactReq {
  @ApiProperty({
    description: 'Contact ID',
    format: 'number',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'First name of the contact',
    format: 'text',
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the contact',
    format: 'text',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email of the contact',
    format: 'email',
    example: 'updateexample@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the contact',
    format: 'text',
    example: '08123456789',
  })
  phone?: string;
}

export class UpdateContactRes {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export class SearchContactReq {
  @ApiPropertyOptional({
    description: 'Username to filter contacts',
    format: 'text',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Email to filter contacts',
    format: 'email',
    example: 'example@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number to filter contacts',
    format: 'text',
    example: '08123456789',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    format: 'number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size for pagination',
    format: 'number',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 10;
}

export class SearchContactRes {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
