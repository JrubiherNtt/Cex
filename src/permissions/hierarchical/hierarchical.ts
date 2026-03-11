/**
 * Hierarchical permission evaluator for nested affiliations
 * Allows dynamic role resolution based on context
 */

import { UserWithAffiliations, PermissionContext, getRolesForContext } from './affiliations';
import { Attributes } from '../core/types';

/**
 * Create a custom evaluator that works with hierarchical affiliations
 *
 * Usage:
 * ```ts
 * const evaluator = createAffiliationEvaluator();
 * const permissions = new Permissions({
 *   config: defaultPermissionConfig,
 *   evaluator,
 * });
 * ```
 */
export function createAffiliationEvaluator() {
  return (policy: any, user: Attributes, resource: Attributes, context?: Attributes): boolean => {
    // Extract user and context from attributes
    const userWithAffiliations = user as unknown as UserWithAffiliations;
    const permContext = context as unknown as PermissionContext | undefined;

    if (!userWithAffiliations?.globalRoles) {
      return false;
    }

    // Get all applicable roles for this context
    getRolesForContext(userWithAffiliations, permContext);

    // Static permission check
    if (policy !== null && typeof policy === 'object' && 'action' in policy) {
      const { action, resource: res } = policy;
      // Check if action matches and user has the required role
      return action === user.action && res === (resource?.id || resource);
    }

    // Dynamic function-based policy
    if (typeof policy === 'function') {
      return policy(user, resource, context);
    }

    return false;
  };
}

/**
 * Create a context with company, application, and team IDs
 * Useful for permission checks within nested structures
 */
export function createContext(
  companyId?: string,
  applicationId?: string,
  teamId?: string,
): PermissionContext {
  return {
    companyId,
    applicationId,
    teamId,
  };
}

/**
 * Determine effective roles for a user in a resource context
 *
 * @param user User with affiliations
 * @param context Permission context (company, app, team IDs)
 * @returns Array of all applicable roles
 */
export function getEffectiveRoles(
  user: UserWithAffiliations,
  context?: PermissionContext,
): string[] {
  return getRolesForContext(user, context);
}
