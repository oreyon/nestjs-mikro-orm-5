import { HttpException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter, editFileName } from '../utils/file-upload.utils';

// Custom decorator for file upload
export const FileUpload = (
  isMultiple: boolean = false,
  maxCount: number = 20,
) => {
  return (
    target: Record<string, any>,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    const interceptor = isMultiple
      ? FilesInterceptor('images', maxCount, {
          storage: diskStorage({
            destination: './uploads',
            filename: editFileName,
          }),
          fileFilter: imageFileFilter,
        })
      : FileInterceptor('image', {
          storage: diskStorage({
            destination: './uploads',
            filename: editFileName,
          }),
          fileFilter: imageFileFilter,
        });

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (isMultiple) {
        // For multiple files
        const files = args.find((arg) => Array.isArray(arg));
        if (!files || files.length === 0) {
          throw new HttpException('Images are required', 400);
        }
      } else {
        // For a single file
        const file = args.find((arg) => arg && arg.originalname);
        if (!file) {
          throw new HttpException('Image is required', 400);
        }
      }
      return originalMethod.apply(this, args);
    };

    UseInterceptors(interceptor)(target, key, descriptor);
  };
};
