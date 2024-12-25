import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  EntityRepositoryType,
} from '@mikro-orm/core';

import { Address } from '../../address/entities/address.entity';
import { User } from '../../auth/entities/user.entity';
import { ContactRepository } from '../contact.repository';

@Entity({ tableName: 'contacts', repository: () => ContactRepository })
export class Contact {
  [EntityRepositoryType]?: ContactRepository;

  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  firstName!: string;

  @Property({ length: 100, nullable: true })
  lastName?: string;

  @Property({ length: 100, nullable: true })
  email?: string;

  @Property({ length: 20, nullable: true })
  phone?: string;

  @Property({ nullable: true })
  image?: string;

  @ManyToOne(() => User)
  user!: User;

  @OneToMany(() => Address, (address) => address.contact)
  address = new Collection<Address>(this);

  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ type: 'date', onCreate: () => new Date() })
  createdAt = new Date();
}
