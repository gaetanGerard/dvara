import { DayOfWeek } from '../../../common/enums/dayofweek.enums';
import { Language } from '../../../common/enums/language.enums';

// Represents a user entity as returned by the API (without password field).
export class User {
  id: number;
  name: string;
  pseudo: string;
  email: string;
  image?: string;
  languageId?: number;
  language?: Language;
  dayOfWeekId?: number;
  dayOfWeek?: DayOfWeek;
  groups: any[]; //TODO after create module Group
  adminGroups: any[]; //TODO after create module Group
  homeDashboard?: number;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
