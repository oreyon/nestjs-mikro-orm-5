import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { Cloudinary } from './cloudinary';

@Module({
  providers: [Cloudinary, CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
