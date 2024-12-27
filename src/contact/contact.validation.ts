import { z, ZodType } from 'zod';

export class ContactValidation {
  static readonly CREATE: ZodType = z.object({
    firstName: z.string().min(3).max(100),
    lastName: z.string().min(3).max(100).optional(),
    email: z.string().email().min(6).max(100).optional(),
    phone: z.string().min(6).max(20).optional(),
  });

  static readonly UPDATE: ZodType = z.object({
    id: z.number().positive(),
    firstName: z.string().min(3).max(100).optional(),
    lastName: z.string().min(3).max(100).optional(),
    email: z.string().email().min(6).max(100).optional(),
    phone: z.string().min(6).max(20).optional(),
  });

  static readonly SEARCH: ZodType = z.object({
    username: z.string().min(3).max(100).optional(),
    email: z.string().email().min(6).max(100).optional(),
    phone: z.string().min(6).max(20).optional(),
    page: z.number().positive().min(1),
    size: z.number().positive().min(1),
    sortBy: z.string().optional(),
    orderBy: z.string().optional(),
  });

  private static MAX_FILE_SIZE = 5000000;
  private static ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  static readonly UPLOAD_IMAGE: ZodType = z.object({
    image: z
      .custom<Express.Multer.File>(
        (file) => !!file?.buffer && !!file?.mimetype,
        {
          message: 'Invalid file.',
        },
      )
      .refine((file) => file.size <= this.MAX_FILE_SIZE, {
        message: 'Max image size is 5MB.',
      })
      .refine((file) => this.ACCEPTED_IMAGE_TYPES.includes(file.mimetype), {
        message: 'Only .jpg, .jpeg, .png and .webp formats are supported.',
      }),
  });
}
