// Basic TypeScript schema for RBAC/ABAC permission model

// Simple RBAC types
export type Role = string;
export type Action = string;
export type Resource = string;

export type StaticPermission = {
  action: Action;
  resource: Resource;
};

// ABAC context attributes (user, resource, environment)
export interface Attributes {
  [key: string]: any;
}

// Policy that can be either a static RBAC rule or a dynamic ABAC function
export type Policy =
  | StaticPermission
  | ((user: Attributes, resource: Attributes, context?: Attributes) => boolean);

// Schema defining which roles have which policies
export interface RoleSchema {
  [role: string]: Policy[];
}

// Top-level permission configuration
export interface PermissionConfig {
  roles: RoleSchema;
  // optionally map users to roles (RBAC)
  userRoles?: { [userId: string]: Role[] };
  // optionally include layouts structure for hierarchical perms
  layouts?: { [key: string]: any };
}

// Helper result for evaluation
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// Core evaluator interface
export interface PermissionChecker {
  can(
    user: Attributes,
    action: Action,
    resource: Attributes | Resource,
    context?: Attributes,
  ): boolean;
  visible(user: Attributes, componentId: string, context?: Attributes): boolean;
}

// Example hook signature for React
export interface UsePermissionsHook {
  can: (action: Action, resource: Resource | Attributes, context?: Attributes) => boolean;
  visible: (componentId: string, context?: Attributes) => boolean;
}

// The library may expose a factory to create checker instances
export type CreatePermissionsOpts = {
  config: PermissionConfig;
  // optional custom evaluator for policies
  evaluator?: (
    policy: Policy,
    user: Attributes,
    resource: Attributes,
    context?: Attributes,
  ) => boolean;
};
