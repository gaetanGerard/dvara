// Entity representing the permissions of a group
export class GroupPermission {
  id: number;
  name: string;
  description?: string;
  appsPerm: AppsPerm;
  dashPerm: DashPerm;
  mediaPerm: MediaPerm;
}

export class AppsPerm {
  id: number;
  name: string;
  canAdd: boolean;
  canEdit: boolean;
  canView: boolean;
  canUse: boolean;
  canDelete: boolean;
}

export class DashPerm {
  id: number;
  name: string;
  canAdd: boolean;
  canEdit: boolean;
  canView: boolean;
  canUse: boolean;
  canDelete: boolean;
}

export class MediaPerm {
  id: number;
  name: string;
  canUpload: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canView: boolean;
  canUse: boolean;
}
