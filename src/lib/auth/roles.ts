/**
 * Role-based access control utilities
 */

export type UserRole = "admin" | "analyst" | "merchandiser" | "executive" | "viewer";

export interface RolePermissions {
  canEditCriteria: boolean;
  canApproveWeights: boolean;
  canCreateExperiments: boolean;
  canDeclareWinners: boolean;
  canManageUsers: boolean;
  canViewAuditLog: boolean;
  canExportData: boolean;
  canManageConnectors: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canEditCriteria: true,
    canApproveWeights: true,
    canCreateExperiments: true,
    canDeclareWinners: true,
    canManageUsers: true,
    canViewAuditLog: true,
    canExportData: true,
    canManageConnectors: true,
  },
  analyst: {
    canEditCriteria: true,
    canApproveWeights: false,
    canCreateExperiments: true,
    canDeclareWinners: false,
    canManageUsers: false,
    canViewAuditLog: true,
    canExportData: true,
    canManageConnectors: false,
  },
  merchandiser: {
    canEditCriteria: false,
    canApproveWeights: false,
    canCreateExperiments: false,
    canDeclareWinners: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canExportData: true,
    canManageConnectors: false,
  },
  executive: {
    canEditCriteria: false,
    canApproveWeights: true,
    canCreateExperiments: false,
    canDeclareWinners: true,
    canManageUsers: false,
    canViewAuditLog: true,
    canExportData: true,
    canManageConnectors: false,
  },
  viewer: {
    canEditCriteria: false,
    canApproveWeights: false,
    canCreateExperiments: false,
    canDeclareWinners: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canExportData: false,
    canManageConnectors: false,
  },
};

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case "merchandiser":
      return "/dashboard/merchandiser";
    case "analyst":
      return "/dashboard/analyst";
    case "executive":
      return "/dashboard/executive";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard";
  }
}
