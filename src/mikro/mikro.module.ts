import { Module } from '@nestjs/common';
import { MikroService } from './mikro.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from '../mikro-orm.config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    WinstonModule.forRoot({
      level: 'debug',
      // format: winston.format.combine(
      //   winston.format.prettyPrint({ colorize: true }),
      // ),
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    }),
  ],
  providers: [MikroService],
  exports: [MikroModule, MikroService],
})
export class MikroModule {}
