export type UserProfile = {
  id: number;
  username: string;
  created_at: string;
  is_admin: boolean;
  is_kb_maintainer: boolean;
  can_access_chat: boolean;
  can_access_kb: boolean;
  can_manage_kb: boolean;
};

export type AuthUser = {
  name: string;
  username: string;
  token: string;
  isAdmin: boolean;
  isKbMaintainer: boolean;
  canAccessChat: boolean;
  canAccessKb: boolean;
  canManageKb: boolean;
};

export const profileToAuthUser = (profile: UserProfile, token: string): AuthUser => ({
  name: profile.username,
  username: profile.username,
  token,
  isAdmin: profile.is_admin,
  isKbMaintainer: profile.is_kb_maintainer,
  canAccessChat: profile.can_access_chat,
  canAccessKb: profile.can_access_kb,
  canManageKb: profile.can_manage_kb,
});
