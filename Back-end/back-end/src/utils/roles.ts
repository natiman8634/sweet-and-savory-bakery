// ============================================================
// ROLE HELPERS
// Keep role checks in one place so routes and controllers agree
// on who can use the back office.
// ============================================================

/** Roles that can work the back office: order feed, status updates and stock. */
export const BACK_OFFICE_ROLES = ['Admin', 'Staff'] as const;

export type BackOfficeRole = (typeof BACK_OFFICE_ROLES)[number];

/** True for Admin and Staff — the roles allowed past `staffAuth`. */
export const isBackOfficeRole = (roleName?: string | null): boolean =>
  !!roleName && (BACK_OFFICE_ROLES as readonly string[]).includes(roleName);

/** True only for Admin — the role allowed past `adminAuth`. */
export const isAdminRole = (roleName?: string | null): boolean => roleName === 'Admin';
