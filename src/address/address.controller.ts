import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import {
  CreateAddressReq,
  CreateAddressRes,
  GetAddressReq,
  GetAddressRes,
  RemoveAddressReq,
  UpdateAddressReq,
  UpdateAddressRes,
} from './dto/address.dto';
import { WebResponse } from '../model/web.model';
import { UserData } from '../common/decorators';
import { User } from '../auth/entities/user.entity';
import { AccessTokenGuard } from '../common/guards';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('contacts/:contactId/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @ApiOperation({ summary: 'Create a new address' })
  @HttpCode(201)
  @Post()
  async create(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() request: CreateAddressReq,
  ): Promise<WebResponse<CreateAddressRes>> {
    request.contactId = contactId;
    const result = await this.addressService.create(user, request);
    return {
      code: HttpStatus.CREATED,
      status: 'Address created successfully',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Get all addresses' })
  @HttpCode(200)
  @Get()
  async findAll(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
  ): Promise<WebResponse<GetAddressRes[]>> {
    const result = await this.addressService.findAll(user, contactId);
    return {
      code: HttpStatus.OK,
      status: 'Addresses retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Get a specific address' })
  @HttpCode(200)
  @Get(':addressId')
  async findOne(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<WebResponse<GetAddressRes>> {
    const request: GetAddressReq = {
      contactId,
      addressId,
    };

    const result = await this.addressService.findOne(user, request);
    return {
      code: HttpStatus.OK,
      status: 'Address retrieved successfully',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Update a specific address' })
  @HttpCode(200)
  @Patch(':addressId')
  async update(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() request: UpdateAddressReq,
  ): Promise<WebResponse<UpdateAddressRes>> {
    request.contactId = contactId;
    request.id = addressId;

    const result = await this.addressService.update(user, request);
    return {
      code: HttpStatus.OK,
      status: 'Address updated successfully',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Remove a specific address' })
  @HttpCode(204)
  @Delete(':addressId')
  async remove(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<WebResponse<boolean>> {
    const request: RemoveAddressReq = {
      contactId: contactId,
      addressId: addressId,
    };
    const result = await this.addressService.remove(user, request);
    return {
      code: HttpStatus.OK,
      status: 'Address removed successfully',
      data: result,
    };
  }
}
