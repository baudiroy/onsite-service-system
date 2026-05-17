export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  mobile?: string | null;
  userType?: string;
  status: string;
  authProvider?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roles?: string[];
  permissions?: string[];
  organizations?: Array<{
    id?: string;
    organizationId?: string;
    organizationCode?: string;
    organizationName?: string;
  }>;
};

export type LoginResponse = {
  accessToken: string;
  user: CurrentUser;
};
