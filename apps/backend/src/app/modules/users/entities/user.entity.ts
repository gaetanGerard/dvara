import { Group } from '../../../common/enums/group.enums';
import { DayOfWeek } from '../../../common/enums/dayofweek.enums';

// Represents a user entity as returned by the API (without password field).
export class User {
  id: number;
  name: string;
  email: string;
  image?: string;
  language: string;
  firstDayOfWeek: DayOfWeek;
  group: Group;
  createdAt: Date;
  updatedAt: Date;
  homeDashboard?: number;
}
