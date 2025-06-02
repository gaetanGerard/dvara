import { DayOfWeek } from '../../../common/enums/dayofweek.enums';
import { Language } from '../../../common/enums/language.enums';
import { Group } from '../../group/entities/group.entity';

// Entity representing a user returned by the API (without password field)
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
  groups: Group[];
  adminGroups: Group[];
  homeDashboard?: number;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordRequested?: boolean;
}
