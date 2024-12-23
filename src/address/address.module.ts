import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { ContactModule } from '../contact/contact.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Address } from './entities/address.entity';

@Module({
  imports: [ContactModule, MikroOrmModule.forFeature([Address])],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
