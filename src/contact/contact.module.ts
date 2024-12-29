import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Contact } from './entities/contact.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [MikroOrmModule.forFeature([Contact]), CloudinaryModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [],
})
export class ContactModule {}
