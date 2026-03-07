import { createContext, useContext, ReactNode, useCallback } from 'react';
import {
  Action,
  Attributes,
  CreatePermissionsOpts,
} from './types';
import { Permissions } from './index';

interface PermissionsContextValue {
  permissions: Permissions;
  user: Attributes;
}

// context for the permissions instance + current user
const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  config,
  evaluator,
  user,
  children,
}: CreatePermissionsOpts & { user: Attributes; children: ReactNode }) {
  const perms = new Permissions({ config, evaluator });
  return (
    <PermissionsContext.Provider value={{ permissions: perms, user }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }

  const { permissions, user } = ctx;

  const can = useCallback(
    (action: Action, resource: Attributes | string, context?: Attributes) =>
      permissions.can(user, action, resource),
    [permissions, user]
  );

  const visible = useCallback(
    (componentId: string, context?: Attributes) =>
      permissions.visible(user, componentId),
    [permissions, user]
  );

  const canAction = useCallback(
    (componentId: string, action: Action, context?: Attributes) =>
      permissions.canAction(user, componentId, action),
    [permissions, user]
  );

  return { can, visible, canAction, user };
}

// ShowIf component
interface ShowIfProps {
  action?: Action;
  resource?: Attributes | string;
  componentId?: string;
  context?: Attributes;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ShowIf({
  action,
  resource,
  componentId,
  context,
  children,
  fallback = null,
}: ShowIfProps) {
  const { can, visible, canAction } = usePermissions();

  let allowed = true;

  if (componentId && action) {
    // Check if action is allowed on component
    allowed = canAction(componentId, action, context);
  } else if (componentId) {
    // Check if component is visible
    allowed = visible(componentId, context);
  } else if (action && resource) {
    // Check if user can perform action on resource
    allowed = can(action, resource, context);
  }

  return <>{allowed ? children : fallback}</>;
}
