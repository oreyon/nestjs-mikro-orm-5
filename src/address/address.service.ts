import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationService } from '../common/validation.service';
import { AddressRepository } from './address.repository';
import { EntityManager } from '@mikro-orm/mysql';
import { ContactService } from '../contact/contact.service';
import { User } from '../auth/entities/user.entity';
import {
  CreateAddressReq,
  CreateAddressRes,
  GetAddressReq,
  GetAddressRes,
  RemoveAddressReq,
  UpdateAddressReq,
  UpdateAddressRes,
} from './dto/address.dto';
import { AddressValidation } from './address.validation';

@Injectable()
export class AddressService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly contactService: ContactService,
    private readonly addressRepository: AddressRepository,
    private em: EntityManager,
  ) {}

  async create(
    user: User,
    request: CreateAddressReq,
  ): Promise<CreateAddressRes> {
    this.logger.debug(`CREATE ADDRESS: ${JSON.stringify(request)}`);

    const createRequest: CreateAddressReq = this.validationService.validate(
      AddressValidation.CREATE,
      request,
    );

    const checkContact = await this.contactService.checkContactExist(
      user.id,
      createRequest.contactId,
    );

    const address = this.addressRepository.create({
      contact: checkContact,
      ...createRequest,
    });

    await this.em.persistAndFlush(address);

    return {
      id: address.id,
      street: address.street,
      city: address.city,
      province: address.province,
      country: address.country,
      postalCode: address.postalCode,
    };
  }

  async findAll(user: User, contactId: number): Promise<GetAddressRes[]> {
    this.logger.debug(`GET ALL ADDRESSES: ${contactId}`);

    const contact = await this.contactService.checkContactExist(
      user.id,
      contactId,
    );

    const addresses = await this.addressRepository.find({
      contact: contact.id,
    });

    return addresses.map((addresses) => ({
      id: addresses.id,
      street: addresses.street,
      city: addresses.city,
      province: addresses.province,
      country: addresses.country,
      postalCode: addresses.postalCode,
    }));
  }

  async findOne(user: User, request: GetAddressReq): Promise<GetAddressRes> {
    this.logger.debug(`GET ADDRESS: ${JSON.stringify(request)}`);

    const getRequest: GetAddressReq = this.validationService.validate(
      AddressValidation.GET,
      request,
    );

    const contact = await this.contactService.checkContactExist(
      user.id,
      getRequest.contactId,
    );

    const address = await this.checkAddressExist(
      contact.id,
      getRequest.addressId,
    );

    return {
      id: address.id,
      street: address.street,
      city: address.city,
      province: address.province,
      country: address.country,
      postalCode: address.postalCode,
    };
  }

  async checkAddressExist(contactId: number, addressId: number) {
    const address = await this.addressRepository.findOne({
      contact: contactId,
      id: addressId,
    });

    if (!address) {
      throw new HttpException('Address not found', 404);
    }

    return address;
  }

  async update(
    user: User,
    request: UpdateAddressReq,
  ): Promise<UpdateAddressRes> {
    this.logger.debug(`UPDATE ADDRESS: ${JSON.stringify(request)}`);

    const updateRequest: UpdateAddressReq = this.validationService.validate(
      AddressValidation.UPDATE,
      request,
    );

    const contact = await this.contactService.checkContactExist(
      user.id,
      updateRequest.contactId,
    );

    const address = await this.checkAddressExist(contact.id, updateRequest.id);

    const data: UpdateAddressReq = {
      id: address.id,
      contactId: contact.id,
      street: updateRequest.street,
      city: updateRequest.city,
      province: updateRequest.province,
      country: updateRequest.country,
      postalCode: updateRequest.postalCode,
    };
    await this.em.flush();

    return {
      id: data.id,
      street: data.street,
      city: data.city,
      province: data.province,
      country: data.country,
      postalCode: data.postalCode,
    };
  }

  async remove(user: User, request: RemoveAddressReq): Promise<boolean> {
    this.logger.debug(`REMOVE ADDRESS: ${JSON.stringify(request)}`);

    const removeRequest: RemoveAddressReq = this.validationService.validate(
      AddressValidation.REMOVE,
      request,
    );

    const contact = await this.contactService.checkContactExist(
      user.id,
      removeRequest.contactId,
    );

    const address = await this.checkAddressExist(
      contact.id,
      removeRequest.addressId,
    );

    await this.addressRepository.nativeDelete({
      id: address.id,
      contact: contact.id,
    });

    return true;
  }
}
