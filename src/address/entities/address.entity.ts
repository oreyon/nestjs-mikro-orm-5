import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  EntityRepositoryType,
} from '@mikro-orm/core';
import { Contact } from '../../contact/entities/contact.entity';
import { AddressRepository } from '../address.repository';

@Entity({ tableName: 'addresses', repository: () => AddressRepository })
export class Address {
  [EntityRepositoryType]?: AddressRepository;

  @PrimaryKey()
  id!: number;

  @Property({ length: 255, nullable: true })
  street?: string;

  @Property({ length: 100, nullable: true })
  city?: string;

  @Property({ length: 100, nullable: true })
  province?: string;

  @Property({ length: 100 })
  country!: string;

  @Property({ length: 10, nullable: true })
  postalCode?: string;

  @ManyToOne(() => Contact)
  contact!: Contact;

  @Property({
    onCreate: () => new Date(),
    columnType: 'datetime',
  })
  createdAt: Date;

  @Property({
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    columnType: 'datetime',
  })
  updatedAt: Date;

  @Property({
    columnType: 'datetime',
    nullable: true,
  })
  deletedAt?: Date;
}
