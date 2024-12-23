import { Role } from '../entities/user.entity';

export class CurrentUserResponse {
  email: string;
  username: string;
  role: Role;
}
