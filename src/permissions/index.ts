import {
  Action,
  Attributes,
  PermissionConfig,
  Policy,
  Resource,
  StaticPermission,
  PermissionChecker,
  PermissionResult,
  CreatePermissionsOpts,
} from './types';

// A very simple evaluator helper
function defaultEvaluator(
  policy: Policy,
  user: Attributes,
  resource: Attributes,
  context?: Attributes
): boolean {
  if (typeof policy === 'function') {
    return policy(user, resource, context);
  }
  // static permission
  const { action, resource: res } = policy as StaticPermission;
  return action === user.action && res === resource;
}

export class Permissions implements PermissionChecker {
  private config: PermissionConfig;
  private evaluator: (
    policy: Policy,
    user: Attributes,
    resource: Attributes,
    context?: Attributes
  ) => boolean;

  constructor(opts: CreatePermissionsOpts) {
    this.config = opts.config;
    this.evaluator = opts.evaluator ?? defaultEvaluator;
  }

  /**
   * Check if a user can perform an action on a resource.
   * resourcePath can be like "company.detail" or "applications.components.list"
   */
  can(
    user: Attributes,
    action: Action,
    resource: Attributes | Resource,
    context?: Attributes
  ): boolean {
    const roles: string[] = user.roles || [];
    const resourcePath = typeof resource === 'string' ? resource : (resource.path || '');

    // For simple RBAC: check if any role has the action+resource combination
    for (const role of roles) {
      const policies = this.config.roles[role] || [];
      for (const policy of policies) {
        if (
          this.evaluator(
            policy,
            { ...user, action },
            typeof resource === 'string' ? { id: resource, path: resource } : resource,
            context
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if a component is visible to the user.
   * componentId is like "company.list" or "applications.team"
   */
  visible(
    user: Attributes,
    componentId: string,
    context?: Attributes
  ): boolean {
    const roles: string[] = user.roles || [];
    // Navigate the tree structure to find the component's visibility rules
    const parts = componentId.split('.');
    let current = (this.config as any).layouts || {};
    
    for (const part of parts) {
      if (current[part]) {
        current = current[part];
      } else {
        return false;
      }
    }

    // current should now be the view object with "show" array
    const visibleRoles = current.show || [];
    return visibleRoles.some((r: string) => roles.includes(r));
  }

  /**
   * Check if a user can perform an action within a component.
   * componentId: "company.detail"
   * action: "edit_instances"
   */
  canAction(
    user: Attributes,
    componentId: string,
    action: Action,
    context?: Attributes
  ): boolean {
    const roles: string[] = user.roles || [];
    const parts = componentId.split('.');
    let current = (this.config as any).layouts || {};

    for (const part of parts) {
      if (current[part]) {
        current = current[part];
      } else {
        return false;
      }
    }

    // current should be the view object with "actions" object
    const allowedRoles = current.actions?.[action] || [];
    return allowedRoles.some((r: string) => roles.includes(r));
  }
}
