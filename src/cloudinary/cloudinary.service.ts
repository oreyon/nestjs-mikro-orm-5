import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as toStream from 'buffer-to-stream';
import { Cloudinary } from './cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly cloudinary: Cloudinary) {}

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    const cloudinaryInstance = this.cloudinary.getInstance();

    return new Promise((resolve, reject) => {
      const stream = toStream(file.buffer);
      const uploadStream = cloudinaryInstance.uploader.upload_stream(
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    const cloudinaryInstance = this.cloudinary.getInstance();

    return new Promise((resolve, reject) => {
      cloudinaryInstance.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
