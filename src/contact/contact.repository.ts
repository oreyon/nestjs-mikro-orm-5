import { EntityRepository } from '@mikro-orm/mysql';
import { Contact } from './entities/contact.entity';

export class ContactRepository extends EntityRepository<Contact> {}
