import { describe, it, expect } from 'vitest';
import {
  getRolesForContext,
  hasAffiliation,
  UserWithAffiliations,
  PermissionContext,
} from '../hierarchical/affiliations';

const mockUser: UserWithAffiliations = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  globalRoles: ['user', 'anonymous'],
  companies: [
    {
      id: 'company-1',
      name: 'Company A',
      roles: ['company_owner'],
      applications: [
        {
          id: 'app-1',
          name: 'App A',
          roles: ['app_owner'],
          teams: [
            {
              id: 'team-1',
              name: 'Team A',
              roles: ['team_owner'],
            },
          ],
        },
        {
          id: 'app-2',
          name: 'App B',
          roles: ['app_member'],
        },
      ],
    },
    {
      id: 'company-2',
      name: 'Company B',
      roles: ['company_member'],
    },
  ],
  applications: [
    {
      id: 'global-app-1',
      name: 'Global App',
      roles: ['app_member'],
      teams: [
        {
          id: 'global-team-1',
          name: 'Global Team',
          roles: ['team_member'],
        },
      ],
    },
  ],
};

describe('Hierarchical Affiliations', () => {
  describe('getRolesForContext', () => {
    it('should return global roles when no context is provided', () => {
      const roles = getRolesForContext(mockUser);
      expect(roles).toContain('user');
      expect(roles).toContain('anonymous');
    });

    it('should include company roles when company context is provided', () => {
      const context: PermissionContext = { companyId: 'company-1' };
      const roles = getRolesForContext(mockUser, context);
      expect(roles).toContain('user');
      expect(roles).toContain('company_owner');
    });

    it('should include app roles when company and app context are provided', () => {
      const context: PermissionContext = {
        companyId: 'company-1',
        applicationId: 'app-1',
      };
      const roles = getRolesForContext(mockUser, context);
      expect(roles).toContain('company_owner');
      expect(roles).toContain('app_owner');
    });

    it('should include team roles in full hierarchy', () => {
      const context: PermissionContext = {
        companyId: 'company-1',
        applicationId: 'app-1',
        teamId: 'team-1',
      };
      const roles = getRolesForContext(mockUser, context);
      expect(roles).toContain('company_owner');
      expect(roles).toContain('app_owner');
      expect(roles).toContain('team_owner');
    });

    it('should handle global app access', () => {
      const context: PermissionContext = { applicationId: 'global-app-1' };
      const roles = getRolesForContext(mockUser, context);
      expect(roles).toContain('app_member');
    });

    it('should handle global team access', () => {
      const context: PermissionContext = {
        applicationId: 'global-app-1',
        teamId: 'global-team-1',
      };
      const roles = getRolesForContext(mockUser, context);
      expect(roles).toContain('team_member');
    });

    it('should remove duplicate roles', () => {
      const roles = getRolesForContext(mockUser);
      const uniqueRoles = new Set(roles);
      expect(roles.length).toBe(uniqueRoles.size);
    });
  });

  describe('hasAffiliation', () => {
    it('should return true for accessible company', () => {
      expect(hasAffiliation(mockUser, 'company', 'company-1')).toBe(true);
      expect(hasAffiliation(mockUser, 'company', 'company-2')).toBe(true);
    });

    it('should return false for inaccessible company', () => {
      expect(hasAffiliation(mockUser, 'company', 'company-999')).toBe(false);
    });

    it('should return true for company app', () => {
      expect(hasAffiliation(mockUser, 'application', 'app-1')).toBe(true);
      expect(hasAffiliation(mockUser, 'application', 'app-2')).toBe(true);
    });

    it('should return true for global app', () => {
      expect(hasAffiliation(mockUser, 'application', 'global-app-1')).toBe(true);
    });

    it('should return false for inaccessible app', () => {
      expect(hasAffiliation(mockUser, 'application', 'app-999')).toBe(false);
    });

    it('should return true for company team', () => {
      expect(hasAffiliation(mockUser, 'team', 'team-1')).toBe(true);
    });

    it('should return true for global team', () => {
      expect(hasAffiliation(mockUser, 'team', 'global-team-1')).toBe(true);
    });

    it('should return false for inaccessible team', () => {
      expect(hasAffiliation(mockUser, 'team', 'team-999')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle user with no affiliations gracefully', () => {
      const minimalUser: UserWithAffiliations = {
        id: 'user-2',
        name: 'Jane',
        email: 'jane@example.com',
        globalRoles: ['anonymous'],
      };

      const roles = getRolesForContext(minimalUser);
      expect(roles).toEqual(['anonymous']);

      expect(hasAffiliation(minimalUser, 'company', 'any')).toBe(false);
    });

    it('should handle context with non-existent IDs', () => {
      const context: PermissionContext = {
        companyId: 'non-existent',
        applicationId: 'non-existent',
      };
      const roles = getRolesForContext(mockUser, context);
      // Should still have global roles
      expect(roles).toContain('user');
    });

    it('should not include roles from unreachable apps', () => {
      const context: PermissionContext = {
        companyId: 'company-2', // No apps
        applicationId: 'app-1', // Not in company-2
      };
      const roles = getRolesForContext(mockUser, context);
      // Should not have app-1 roles
      expect(roles).not.toContain('app_owner');
    });
  });
});
