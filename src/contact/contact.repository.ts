import { EntityRepository } from '@mikro-orm/mysql';
import { Contact } from './entities/contact.entity';
import { HttpException } from '@nestjs/common';

export class ContactRepository extends EntityRepository<Contact> {
  async checkContactExist(userId: number, contactId: number): Promise<Contact> {
    const contact: Contact = await this.findOne({
      id: contactId,
      user: userId,
    });

    if (!contact) {
      throw new HttpException('Contact not found', 404);
    }

    return contact;
  }
}
