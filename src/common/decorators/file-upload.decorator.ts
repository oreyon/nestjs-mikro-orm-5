import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter, editFileName } from '../utils/file-upload.utils';

// Custom decorator for file upload
export const FileUpload = (
  isMultiple: boolean = false,
  maxCount: number = 20,
) => {
  return (target, key, descriptor) => {
    const interceptor = isMultiple
      ? FilesInterceptor('image', maxCount, {
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

    UseInterceptors(interceptor)(target, key, descriptor);
  };
};
