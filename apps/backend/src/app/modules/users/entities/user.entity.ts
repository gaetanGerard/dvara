import { Role } from '../../../common/enums/role.enums';
import { DayOfWeek } from '../../../common/enums/dayofweek.enums';

// Represents a user entity as returned by the API (without password field).
export class User {
  id: number;
  name: string;
  email: string;
  image?: string;
  language: string;
  firstDayOfWeek: DayOfWeek;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  homeDashboard?: number;
}
