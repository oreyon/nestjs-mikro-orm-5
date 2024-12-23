import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, ConfigOptions } from 'cloudinary';

@Injectable()
export class Cloudinary {
  constructor() {
    const config: ConfigOptions = {
      cloud_name: process.env.CLD_CLOUD_NAME,
      api_key: process.env.CLD_API_KEY,
      api_secret: process.env.CLD_API_SECRET,
    };

    cloudinary.config(config);
  }

  getInstance(): typeof cloudinary {
    return cloudinary;
  }
}
