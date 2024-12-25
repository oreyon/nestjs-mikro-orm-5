import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';

export const QueryDto = createParamDecorator(
  (DtoClass: new () => any, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const dtoInstance = new DtoClass();

    for (const key of Object.keys(query)) {
      if (key in dtoInstance) {
        // Only map query params that exist in the DTO
        const value = query[key];
        const targetType = typeof dtoInstance[key];

        if (targetType === 'number') {
          const parsedValue = parseInt(value, 10);
          if (isNaN(parsedValue)) {
            throw new HttpException(`Invalid value for ${key}`, 400);
          }
          dtoInstance[key] = parsedValue;
        } else {
          dtoInstance[key] = value; // Assign as string by default
        }
      }
    }

    console.log('Populated DTO:', dtoInstance);
    return dtoInstance;
  },
);
