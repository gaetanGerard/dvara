// Entity representing a group returned by the API
import { GroupPermission } from './permissions.entity';
import { GroupSetting } from './settings.entity';

export class Group {
  id: number;
  name: string;
  system: boolean;
  users?: Array<{ id: number; name: string; pseudo: string; email: string }>;

  admins?: Array<{ id: number; name: string; pseudo: string; email: string }>;

  permissions?: GroupPermission[];
  settings?: GroupSetting;
}
