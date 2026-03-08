/**
 * React hook for hierarchical permission management
 * Simplifies working with nested affiliations
 */

import { usePermissions } from './react';
import {
  UserWithAffiliations,
  PermissionContext,
  getRolesForContext,
  hasAffiliation,
} from './affiliations';
import { Attributes } from './types';

/**
 * Hook for managing permissions with hierarchical affiliations
 * 
 * Extends usePermissions() with context-aware evaluation
 */
export function useHierarchicalPermissions() {
  const { can, visible, canAction, user } = usePermissions();

  const userWithAffiliations = user as unknown as UserWithAffiliations;

  /**
   * Get effective roles for a given context
   */
  const getRoles = (context?: PermissionContext) => {
    return getRolesForContext(userWithAffiliations, context);
  };

  /**
   * Check if user is affiliated with a company, application, or team
   */
  const hasAffiliation_ = (
    type: 'company' | 'application' | 'team',
    id: string
  ) => {
    return hasAffiliation(userWithAffiliations, type, id);
  };

  /**
   * Check permission in a specific context
   */
  const canInContext = (
    action: string,
    resource: string,
    context?: PermissionContext
  ) => {
    return can(action, {
      id: resource,
      ...context,
    } as Attributes);
  };

  /**
   * Get all companies the user has access to (with roles)
   */
  const getCompanies = () => {
    return userWithAffiliations?.companies || [];
  };

  /**
   * Get all applications in a company
   */
  const getApplicationsInCompany = (companyId: string) => {
    const company = userWithAffiliations?.companies?.find(
      (c) => c.id === companyId
    );
    return company?.applications || [];
  };

  /**
   * Check if user can access a specific company
   */
  const canAccessCompany = (companyId: string) => {
    return hasAffiliation_(
      'company',
      companyId
    );
  };

  /**
   * Check if user can access a specific application
   */
  const canAccessApplication = (applicationId: string) => {
    return hasAffiliation_('application', applicationId);
  };

  /**
   * Check if user can perform an action within an application context
   */
  const canActionInApplication = (
    applicationId: string,
    companyId: string | undefined
  ) => {
    const context: PermissionContext = {
      applicationId,
      companyId,
    };
    const roles = getRoles(context);

    // Check permission based on context roles
    return roles.length > 0;
  };

  return {
    can,
    visible,
    canAction,
    user: userWithAffiliations,
    // New hierarchical methods
    getRoles,
    hasAffiliation: hasAffiliation_,
    canInContext,
    getCompanies,
    getApplicationsInCompany,
    canAccessCompany,
    canAccessApplication,
    canActionInApplication,
  };
}
