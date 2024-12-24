import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Cloudinary {
  constructor(configService: ConfigService) {
    const config: ConfigOptions = {
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
    };

    cloudinary.config(config);
  }

  getInstance(): typeof cloudinary {
    return cloudinary;
  }
}
