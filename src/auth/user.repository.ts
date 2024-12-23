import { User } from './entities/user.entity';
import { EntityRepository } from '@mikro-orm/mysql';

export class UserRepository extends EntityRepository<User> {}
