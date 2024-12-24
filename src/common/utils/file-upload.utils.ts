import { extname } from 'path';
import { HttpException } from '@nestjs/common';

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new HttpException('File should be image type', 400), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  // const originalName = file.originalname.split('.')[0]; // Original file name without extension
  const fileExtName = extname(file.originalname); // File extension (e.g., .jpg)
  const randomName = Array(8)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16)) // Random name generator
    .join('');

  // You can also use a timestamp or UUID to generate more unique names
  const timestamp = Date.now(); // Example of timestamp-based unique naming

  // New file name pattern: originalname-timestamp-randomname.extension
  const newFileName = `${timestamp}-${randomName}${fileExtName}`;
  callback(null, newFileName);
};
