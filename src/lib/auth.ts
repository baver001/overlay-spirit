// Авторизация и роли пользователей

// Email суперадмина (владелец) - только он имеет доступ к полной админке
export const SUPERADMIN_EMAIL = 'pavel@pokataev.com';

// Проверка, является ли пользователь суперадмином
export function isSuperAdmin(email: string | undefined | null): boolean {
  return email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
}

// Типы ролей
export type UserRole = 'admin' | 'customer';

// Проверка доступа к админке (только для суперадмина)
export function hasAdminAccess(email: string | undefined | null, role: UserRole | undefined | null): boolean {
  return isSuperAdmin(email) && role === 'admin';
}

