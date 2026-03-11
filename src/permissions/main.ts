/**
 * @package permission-system
 * Librería RBAC/ABAC de permisos para React
 *
 * Uso:
 * 1. Importa { PermissionsProvider, usePermissions, ShowIf } de esta librería
 * 2. Envuelve tu app con PermissionsProvider
 * 3. Usa el hook o componente en cualquier parte de tu árbol
 */

// Exporta tipos
export type {
  Role,
  Action,
  Resource,
  Attributes,
  Policy,
  RoleSchema,
  PermissionConfig,
  PermissionResult,
  PermissionChecker,
  UsePermissionsHook,
  CreatePermissionsOpts,
} from './types';

// Exporta clase principal
export { Permissions } from './index';

// Exporta utilidades de React
export { PermissionsProvider, usePermissions, ShowIf } from './react';

// Exporta configuración default
export { defaultPermissionConfig, createPermissionConfigFromLayouts } from './config';

// Exporta tipos y utilidades para afiliaciones jerárquicas
export type {
  UserAffiliation,
  ApplicationAffiliation,
  TeamAffiliation,
  UserWithAffiliations,
  PermissionContext,
} from './affiliations';

export { getRolesForContext, hasAffiliation } from './affiliations';

export { createAffiliationEvaluator, createContext, getEffectiveRoles } from './hierarchical';

export { useHierarchicalPermissions } from './useHierarchicalPermissions';
