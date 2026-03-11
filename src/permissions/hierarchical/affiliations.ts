/**
 * Types for hierarchical user affiliations
 * Supports nested structure: user → companies → applications → roles
 */

export interface UserAffiliation {
  id: string;
  name: string;
  roles: string[];
  applications?: ApplicationAffiliation[];
}

export interface ApplicationAffiliation {
  id: string;
  name: string;
  roles: string[];
  teams?: TeamAffiliation[];
}

export interface TeamAffiliation {
  id: string;
  name: string;
  roles: string[];
}

/**
 * User data structure with global info and nested affiliations
 */
export interface UserWithAffiliations {
  id: string;
  name: string;
  email: string;
  globalRoles: string[]; // admin, user, anonymous, etc.
  companies?: UserAffiliation[];
  applications?: ApplicationAffiliation[]; // global app access
  teams?: TeamAffiliation[]; // global team access
}

/**
 * Context for permission evaluation
 * Can specify which company/application/team is being accessed
 */
export interface PermissionContext {
  companyId?: string;
  applicationId?: string;
  teamId?: string;
  [key: string]: any;
}

/**
 * Helper to extract all roles for a user in a given context
 */
export function getRolesForContext(
  user: UserWithAffiliations,
  context?: PermissionContext,
): string[] {
  const roles = [...user.globalRoles];

  if (context?.companyId) {
    const company = user.companies?.find((c) => c.id === context.companyId);
    if (company) {
      roles.push(...company.roles);

      // If also filtering by app, get app roles within this company
      if (context.applicationId) {
        const app = company.applications?.find((a) => a.id === context.applicationId);
        if (app) {
          roles.push(...app.roles);

          // If also filtering by team
          if (context.teamId) {
            const team = app.teams?.find((t) => t.id === context.teamId);
            if (team) {
              roles.push(...team.roles);
            }
          }
        }
      }
    }
  } else if (context?.applicationId) {
    // Global app access (not within a company context)
    const app = user.applications?.find((a) => a.id === context.applicationId);
    if (app) {
      roles.push(...app.roles);

      if (context.teamId) {
        const team = app.teams?.find((t) => t.id === context.teamId);
        if (team) {
          roles.push(...team.roles);
        }
      }
    }
  } else if (context?.teamId) {
    // Global team access
    const team = user.teams?.find((t) => t.id === context.teamId);
    if (team) {
      roles.push(...team.roles);
    }
  }

  return [...new Set(roles)]; // Remove duplicates
}

/**
 * Helper to check if user has an affiliation (company, app, etc.)
 */
export function hasAffiliation(
  user: UserWithAffiliations,
  affiliationType: 'company' | 'application' | 'team',
  affiliationId: string,
): boolean {
  switch (affiliationType) {
    case 'company':
      return user.companies?.some((c) => c.id === affiliationId) || false;
    case 'application':
      // Check global apps and apps within companies
      return (
        user.applications?.some((a) => a.id === affiliationId) ||
        user.companies?.some((c) => c.applications?.some((a) => a.id === affiliationId)) ||
        false
      );
    case 'team':
      // Recursively check in applications
      return (
        user.teams?.some((t) => t.id === affiliationId) ||
        user.applications?.some((a) => a.teams?.some((t) => t.id === affiliationId)) ||
        user.companies?.some((c) =>
          c.applications?.some((a) => a.teams?.some((t) => t.id === affiliationId)),
        ) ||
        false
      );
    default:
      return false;
  }
}
