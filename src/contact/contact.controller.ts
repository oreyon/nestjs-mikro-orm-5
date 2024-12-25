import { ContactService } from './contact.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AccessTokenGuard } from '../common/guards';
import { ApiOperation } from '@nestjs/swagger';
import {
  CreateContactRequest,
  CreateContactResponse,
  GetContactResponse,
  SearchContactReq,
  SearchContactRes,
  UpdateContactReq,
} from './dto/contact.dto';
import { UserData } from '../common/decorators';
import { User } from '../auth/entities/user.entity';
import { WebResponse } from '../model/web.model';
import { QueryDto } from '../common/decorators/search-query-dto.decorator';

@UseGuards(AccessTokenGuard)
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: 'Create a new contact' })
  @HttpCode(201)
  @Post()
  async create(
    @UserData() user: User,
    @Body() request: CreateContactRequest,
  ): Promise<WebResponse<CreateContactResponse>> {
    const result = await this.contactService.create(user, request);

    return {
      code: HttpStatus.CREATED,
      status: 'Created',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Get all contacts' })
  @HttpCode(200)
  @Get()
  async findAll(
    @UserData() user: User,
    // @Query('username') username?: string,
    // @Query('email') email?: string,
    // @Query('phone') phone?: string,
    // @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    // @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    @Query(new ValidationPipe({ transform: true })) request: SearchContactReq,
  ): Promise<WebResponse<SearchContactRes[]>> {
    // const request: SearchContactReq = {
    //   username: username,
    //   email: email,
    //   phone: phone,
    //   page: page || 1,
    //   size: size || 10,
    // };

    console.log('Query DTO:', request);

    const result = await this.contactService.findAll(user, request);

    return {
      code: HttpStatus.OK,
      status: 'Success get all contacts',
      data: result.data,
      paging: result.paging,
    };
  }

  @ApiOperation({ summary: 'Get a contact' })
  @HttpCode(200)
  @Get(':contactId')
  async findOne(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
  ): Promise<WebResponse<GetContactResponse>> {
    const result = await this.contactService.findOne(user, contactId);

    return {
      code: HttpStatus.OK,
      status: 'Success get a contact',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Update a contact' })
  @HttpCode(200)
  @Patch(':contactId')
  async update(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Body() request: UpdateContactReq,
  ) {
    request.id = contactId;
    const result = await this.contactService.update(user, request);

    return {
      code: HttpStatus.OK,
      status: 'Success update a contact',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Delete a contact' })
  @HttpCode(204)
  @Delete(':contactId')
  async remove(
    @UserData() user: User,
    @Param('contactId', ParseIntPipe) contactId: number,
  ): Promise<WebResponse<boolean>> {
    const result = await this.contactService.remove(user, contactId);

    return {
      code: HttpStatus.NO_CONTENT,
      status: 'Success delete a contact',
      data: result,
    };
  }
}
