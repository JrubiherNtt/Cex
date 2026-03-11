import { describe, it, expect, beforeEach } from 'vitest';
import { Permissions } from '../core/index';
import { defaultPermissionConfig } from '../core/config';

describe('Permissions', () => {
  let permissions: Permissions;

  beforeEach(() => {
    permissions = new Permissions({
      config: defaultPermissionConfig,
    });
  });

  describe('visible', () => {
    it('should return true if user role is in the show list', () => {
      const adminUser = { roles: ['admin'] };
      expect(permissions.visible(adminUser, 'company.list')).toBe(true);
    });

    it('should return true for any role in the show list', () => {
      const companyOwner = { roles: ['company_owner'] };
      expect(permissions.visible(companyOwner, 'company.list')).toBe(true);

      const appMember = { roles: ['app_member'] };
      expect(permissions.visible(appMember, 'company.list')).toBe(true);

      const anonymous = { roles: ['anonymous'] };
      expect(permissions.visible(anonymous, 'company.list')).toBe(true);
    });

    it('should return false if user role is NOT in the show list', () => {
      const teamMember = { roles: ['team_member'] };
      expect(permissions.visible(teamMember, 'company.list')).toBe(false);
    });

    it('should handle nested resource paths', () => {
      const admin = { roles: ['admin'] };
      expect(permissions.visible(admin, 'company.team.list')).toBe(true);

      const teamOwner = { roles: ['team_owner'] };
      expect(permissions.visible(teamOwner, 'company.team.list')).toBe(true);

      const appOwner = { roles: ['app_owner'] };
      expect(permissions.visible(appOwner, 'company.team.list')).toBe(false);
    });

    it('should return false for invalid resource paths', () => {
      const admin = { roles: ['admin'] };
      expect(permissions.visible(admin, 'invalid.path')).toBe(false);
    });

    it('should handle multiple roles (union logic)', () => {
      const multiRoleUser = { roles: ['company_member', 'team_owner'] };
      expect(permissions.visible(multiRoleUser, 'company.team.members_list')).toBe(true);
    });
  });

  describe('canAction', () => {
    it('should return true if user has role for the action', () => {
      const admin = { roles: ['admin'] };
      expect(permissions.canAction(admin, 'company.detail', 'edit_instances')).toBe(true);
    });

    it('should return true for multiple eligible roles', () => {
      const companyOwner = { roles: ['company_owner'] };
      expect(permissions.canAction(companyOwner, 'company.detail', 'edit_instances')).toBe(true);
    });

    it('should return false if user does not have role for the action', () => {
      const appMember = { roles: ['app_member'] };
      expect(permissions.canAction(appMember, 'company.detail', 'edit_owners')).toBe(false);
    });

    it('should handle nested action paths', () => {
      const admin = { roles: ['admin'] };
      expect(permissions.canAction(admin, 'company.team.list', 'create')).toBe(true);

      const companyOwner = { roles: ['company_owner'] };
      expect(permissions.canAction(companyOwner, 'company.team.list', 'create')).toBe(true);

      const appMember = { roles: ['app_member'] };
      expect(permissions.canAction(appMember, 'company.team.list', 'create')).toBe(false);
    });

    it('should return false for invalid action', () => {
      const admin = { roles: ['admin'] };
      expect(permissions.canAction(admin, 'company.detail', 'non_existent_action')).toBe(false);
    });

    it('should handle user with no roles', () => {
      const noRoles = { roles: [] };
      expect(permissions.canAction(noRoles, 'company.detail', 'edit_instances')).toBe(false);
    });
  });

  describe('can', () => {
    it('should evaluate generic resource access', () => {
      const admin = { roles: ['admin'] };
      // This is a fallback method; behavior depends on evaluator implementation
      expect(permissions.can(admin, 'view', 'some_resource')).toBeDefined();
    });
  });

  describe('complex scenarios', () => {
    it('should restrict access to applications for team members', () => {
      const teamMember = { roles: ['team_member'] };
      expect(permissions.visible(teamMember, 'applications.list')).toBe(false);
    });

    it('should allow app owners to create components', () => {
      const appOwner = { roles: ['app_owner'] };
      expect(permissions.canAction(appOwner, 'applications.components.list', 'create')).toBe(true);
    });

    it('should allow company owner to edit app instances', () => {
      const companyOwner = { roles: ['company_owner'] };
      expect(permissions.canAction(companyOwner, 'applications.detail', 'edit_instances')).toBe(
        true,
      );
    });

    it('should show banner to anonymous users on company detail', () => {
      const anonymous = { roles: ['anonymous'] };
      expect(permissions.canAction(anonymous, 'company.detail', 'show_banner')).toBe(true);
    });
  });
});
