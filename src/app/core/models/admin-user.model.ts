export type AdminRole = 'super_admin' | 'manager' | 'support';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'active' | 'revoked';
}
