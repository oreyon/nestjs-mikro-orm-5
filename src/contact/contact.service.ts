import { HttpException, Inject, Injectable } from '@nestjs/common';

import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from '../common/validation.service';
import { ContactRepository } from './contact.repository';
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
import { EntityMetadata, QueryOrder } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/mysql';

@Injectable()
export class ContactService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly configService: ConfigService,
    private contactRepository: ContactRepository,
    private em: EntityManager,
    private orm: MikroORM,
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
      image: contact.image,
    };
  }

  async createMany(
    user: User,
    requests: CreateContactRequest[],
  ): Promise<CreateContactResponse[]> {
    this.logger.debug(`CREATE MANY CONTACTS: ${JSON.stringify(requests)}`);

    const createRequests: CreateContactRequest[] = requests.map((request) =>
      this.validationService.validate(ContactValidation.CREATE, request),
    );

    const contacts: Contact[] = createRequests.map((request) =>
      this.contactRepository.create({
        ...request,
        user,
      }),
    );

    await this.em.persistAndFlush(contacts);

    return contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      image: contact.image,
    }));
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

    console.log('sortBy:', searchReq.sortBy);
    console.log('orderBy:', searchReq.orderBy);
    /*
    const metadata: EntityMetadata = this.orm.getMetadata().get(Contact.name);

    // Defaults
    const defaultField = 'id'; // Default field for sorting
    const defaultDirection = QueryOrder.ASC; // Default sorting direction

    // const validFields = [
    //   'id',
    //   'firstName',
    //   'lastName',
    //   'email',
    //   'phone',
    //   'createdAt',
    //   'updatedAt',
    // ];
    const validFields = Object.keys(metadata.properties);

    // Determine the sorting field
    // const field = searchReq.sortBy || defaultField;
    const field = validFields.includes(searchReq.sortBy || '')
      ? searchReq.sortBy
      : defaultField;

    // Log a warning for invalid fields
    if (searchReq.sortBy && !validFields.includes(searchReq.sortBy)) {
      console.warn(
        `Invalid sortBy field "${searchReq.sortBy}", falling back to default "${defaultField}"`,
      );
    }

    // Determine the sorting direction
    const direction =
      searchReq.orderBy?.toLowerCase() === 'desc'
        ? QueryOrder.DESC
        : QueryOrder.ASC;

    // Construct the orderBy object
    const orderBy = {
      [field]: direction,
    };

    */

    // ========================================

    // list fields in the entity
    const metadata: EntityMetadata = this.orm.getMetadata().get(Contact.name);
    const validFields = Object.keys(metadata.properties);

    // Defaults sortBy and orderBy
    const defaultField = 'id';
    // const defaultDirection = QueryOrder.ASC;

    // Split sortBy and orderBy by comma
    const sortFields = (searchReq.sortBy || defaultField).split(',');
    const sortDirections = (searchReq.orderBy || 'asc').split(',');

    // Construct the orderBy object
    const orderBy: Record<string, QueryOrder> = {};

    // Iterate through sortFields and match with sortDirections
    sortFields.forEach((field, index) => {
      const direction =
        sortDirections[index]?.toLowerCase() === 'desc'
          ? QueryOrder.DESC
          : QueryOrder.ASC;

      if (validFields.includes(field)) {
        orderBy[field] = direction;
      } else {
        console.warn(`Invalid sortBy field "${field}", skipping.`);
      }
    });

    // Log the constructed orderBy object
    console.log('Constructed orderBy:', orderBy);
    // ========================================
    const [contacts, totalContacts] = await this.contactRepository.findAndCount(
      {
        user: user.id,
        $and: filters,
      },
      {
        limit: searchReq.size,
        offset: (searchReq.page - 1) * searchReq.size,
        orderBy: orderBy,
      },
    );

    // Map the entity data to the response DTO
    const data = contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      image: contact.image,
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
      image: contact.image,
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
      image: contact.image,
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

  async uploadImage(user: User, contactId: number, file: Express.Multer.File) {
    this.logger.debug(`File size: ${file?.size}`);
    this.logger.debug(`File mimetype: ${file?.mimetype}`);

    this.validationService.validate(ContactValidation.UPLOAD_IMAGE, {
      image: file,
    });

    // check contact exist
    const contact: Contact = await this.checkContactExist(user.id, contactId);

    const result = await this.cloudinaryService.uploadImage(file);
    contact.image = result.secure_url;
    await this.em.flush();

    return {
      imageId: result.public_id,
      size: result.bytes / 1000,
      format: result.format,
      imageUrl: result.url,
      imageSecureUrl: result.secure_url,
      createdAt: result.created_at,
    };
  }
}
