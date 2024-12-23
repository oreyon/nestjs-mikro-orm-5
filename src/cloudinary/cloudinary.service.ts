import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import toStream from 'buffer-to-stream';
import { Cloudinary } from './cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly cloudinary: Cloudinary) {}

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    const cloudinaryInstance = this.cloudinary.getInstance();

    return new Promise((resolve, reject) => {
      const upload = cloudinaryInstance.uploader.upload_stream(
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
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
