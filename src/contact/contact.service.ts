import { HttpException, Inject, Injectable } from '@nestjs/common';

import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from '../common/validation.service';
import { ContactRepository } from './contact.repository';
import { EntityManager, QueryOrder } from '@mikro-orm/mysql';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  CreateContactRequest,
  CreateContactResponse,
  GetContactResponse,
  SearchContactReq,
  SearchContactRes,
  UpdateContactReq,
  UpdateContactRes,
} from './dto/contact.dto';
import { ContactValidation } from './contact.validation';
import { Contact } from './entities/contact.entity';
import { User } from '../auth/entities/user.entity';
import { Paging } from '../model/web.model';

@Injectable()
export class ContactService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly configService: ConfigService,
    private contactRepository: ContactRepository,
    private em: EntityManager,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    user: User,
    request: CreateContactRequest,
  ): Promise<CreateContactResponse> {
    this.logger.debug(`CREATE CONTACT: ${JSON.stringify(request)}`);

    const createRequest: CreateContactRequest = this.validationService.validate(
      ContactValidation.CREATE,
      request,
    );

    const contact: Contact = this.contactRepository.create({
      ...createRequest,
      user,
    });

    await this.em.persistAndFlush(contact);

    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
    };
  }

  async findAll(
    user: User,
    request: SearchContactReq,
  ): Promise<{ data: SearchContactRes[]; paging: Paging }> {
    this.logger.debug(`GET ALL CONTACTS: ${JSON.stringify(request)}`);

    // Validate the request using your validation service
    const searchReq: SearchContactReq = this.validationService.validate(
      ContactValidation.SEARCH,
      request,
    );

    const filters: any[] = [];

    // Build filters dynamically based on provided query parameters
    if (searchReq.username) {
      filters.push({
        $or: [
          { firstName: { $like: `%${searchReq.username}%` } },
          { lastName: { $like: `%${searchReq.username}%` } },
        ],
      });
    }

    if (searchReq.email) {
      filters.push({ email: { $like: `%${searchReq.email}%` } });
    }

    if (searchReq.phone) {
      filters.push({ phone: { $like: `%${searchReq.phone}%` } });
    }

    // Fetch contacts with pagination and sorting
    const [contacts, totalContacts] = await this.contactRepository.findAndCount(
      {
        user: user.id,
        $and: filters,
      },
      {
        limit: searchReq.size,
        offset: (searchReq.page - 1) * searchReq.size,
        // orderBy: { id: QueryOrder.DESC },
      },
    );

    // Map the entity data to the response DTO
    const data = contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
    }));

    // Calculate total pages
    const totalPageCount = Math.ceil(totalContacts / searchReq.size);

    return {
      data,
      paging: {
        current_page: searchReq.page,
        size: searchReq.size,
        total_page: totalPageCount,
      },
    };
  }

  async findOne(user: User, contactId: number): Promise<GetContactResponse> {
    this.logger.debug(`GET CONTACT: ${JSON.stringify(contactId)}`);

    const contact: Contact = await this.contactRepository.findOne({
      id: contactId,
      user,
    });

    if (!contact) {
      throw new HttpException('Contact not found', 404);
    }

    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
    };
  }

  async checkContactExist(userId: number, contactId: number): Promise<Contact> {
    const contact: Contact = await this.contactRepository.findOne({
      id: contactId,
      user: userId,
    });

    if (!contact) {
      throw new HttpException('Contact not found', 404);
    }

    return contact;
  }

  async update(
    user: User,
    request: UpdateContactReq,
  ): Promise<UpdateContactRes> {
    this.logger.debug(`UPDATE CONTACT: ${JSON.stringify(request)}`);

    const updateRequest: UpdateContactReq = this.validationService.validate(
      ContactValidation.UPDATE,
      request,
    );

    const contact: Contact = await this.checkContactExist(
      user.id,
      updateRequest.id,
    );

    if (contact.user.id !== user.id) {
      throw new HttpException('Unauthorized', 401);
    }

    contact.firstName = updateRequest.firstName;
    contact.lastName = updateRequest.lastName;
    contact.email = updateRequest.email;
    contact.phone = updateRequest.phone;
    await this.em.persistAndFlush(contact);

    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
    };
  }

  async remove(user: User, contactId: number): Promise<boolean> {
    this.logger.debug(`DELETE CONTACT: ${JSON.stringify(contactId)}`);

    const contact: Contact = await this.checkContactExist(user.id, contactId);

    if (contact.user.id !== user.id) {
      throw new HttpException('Unauthorized', 401);
    }

    await this.contactRepository.nativeDelete({ id: contactId, user: user.id });
    await this.em.flush();

    return true;
  }
}
