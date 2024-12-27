import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AddressService } from './address.service';
import {
  CreateAddressReq,
  CreateAddressRes,
  UpdateAddressReq,
} from './dto/address.dto';
import { WebResponse } from '../model/web.model';
import { UserData } from '../common/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(
    @UserData() user: User,
    @Body() request: CreateAddressReq,
  ): Promise<WebResponse<CreateAddressRes>> {
    return null;
  }

  @Get()
  findAll() {
    return null;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return null;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() request: UpdateAddressReq) {
    return null;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return null;
  }
}
