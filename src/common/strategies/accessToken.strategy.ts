import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EntityManager, MikroORM } from '@mikro-orm/mysql';
import { Request } from 'express';
import { User } from '../../auth/entities/user.entity';

export class JwtPayload {
  jti: string;
  sub: number;
  iat: number;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'accessTokenGuard',
) {
  constructor(
    readonly configService: ConfigService,
    readonly em: EntityManager,
    readonly orm: MikroORM,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        AccessTokenStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  private static extractJWT(req: Request): string | null {
    const tokenFromCookies = req.signedCookies['accesstoken'];
    if (tokenFromCookies) {
      return tokenFromCookies;
    }
    return null;
  }

  async validate(payload: JwtPayload) {
    const jti = payload.jti;
    if (!jti) {
      throw new HttpException('Invalid access token', 401);
    }

    const user = await this.em.findOne(User, { id: payload.sub });

    if (!user) {
      throw new HttpException('Invalid access token', 401);
    }

    return user;
  }
}
