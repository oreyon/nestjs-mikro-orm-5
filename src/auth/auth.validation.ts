import { z, ZodType } from 'zod';

export class AuthValidation {
  static readonly REGISTER: ZodType = z.object({
    email: z.string().email().min(6).max(100),
    password: z.string().min(6).max(100),
    username: z.string().min(6).max(100),
  });

  static readonly EMAIL_VERIFICATION: ZodType = z.object({
    email: z.string().email().min(6).max(100),
    emailVerificationToken: z.string().min(6).max(100),
  });

  static readonly LOGIN: ZodType = z.object({
    email: z.string().email().min(6).max(100),
    password: z.string().min(6).max(100),
  });

  static readonly REFRESH_TOKEN: ZodType = z.string().min(6).max(255);

  static readonly FORGOT_PASSWORD: ZodType = z.object({
    email: z.string().email().min(6).max(100),
  });

  static readonly RESET_PASSWORD: ZodType = z.object({
    email: z.string().email().min(6).max(100),
    newPassword: z.string().min(6).max(100),
    repeatNewPassword: z.string().min(6).max(100),
    resetPasswordToken: z.string().min(6).max(100),
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
