import { Permissions } from '../core/index';
import { createPermissionConfigFromLayouts, defaultPermissionConfig } from '../core/config';

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
    it('should return true for matching static policy with string resource', () => {
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: 'company.detail' }],
          },
        },
      });

      const admin = { roles: ['admin'] };
      expect(staticPermissions.can(admin, 'view', 'company.detail')).toBe(true);
    });

    it('should return true for matching static policy with object resource', () => {
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: 'company.detail' }],
          },
        },
      });

      const admin = { roles: ['admin'] };
      expect(staticPermissions.can(admin, 'view', { id: 'company.detail' })).toBe(true);
    });

    it('should use dynamic ABAC policy functions when provided', () => {
      const dynamicPermissions = new Permissions({
        config: {
          roles: {
            manager: [
              (user, resource) => user.action === 'edit' && resource.path === 'applications.detail',
            ],
          },
        },
      });

      const manager = { roles: ['manager'] };
      expect(dynamicPermissions.can(manager, 'edit', 'applications.detail')).toBe(true);
      expect(dynamicPermissions.can(manager, 'view', 'applications.detail')).toBe(false);
    });

    it('should return false when no policy matches', () => {
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: 'company.detail' }],
          },
        },
      });

      const admin = { roles: ['admin'] };
      expect(staticPermissions.can(admin, 'delete', 'company.detail')).toBe(false);
      expect(staticPermissions.can(admin, 'view', 'applications.detail')).toBe(false);
    });

    it('should return false when user has no roles', () => {
      expect(permissions.can({ roles: [] }, 'view', 'company.detail')).toBe(false);
    });

    it('should support static policies with object resource when resource.id is missing', () => {
      const sharedResource = { path: 'company.detail' };
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: sharedResource } as any],
          },
        },
      });

      const admin = { roles: ['admin'] };
      expect(staticPermissions.can(admin, 'view', sharedResource as any)).toBe(true);
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

    it('should return false for invalid nested action path', () => {
      const admin = { roles: ['admin'] };
      expect(permissions.canAction(admin, 'company.invalid.detail', 'create')).toBe(false);
    });
  });

  describe('branch coverage guards', () => {
    it('should return false when user has roles not present in config', () => {
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: 'company.detail' }],
          },
        },
      });

      expect(staticPermissions.can({ roles: ['ghost_role'] }, 'view', 'company.detail')).toBe(
        false,
      );
    });

    it('should return false when user has no roles property', () => {
      expect(permissions.can({}, 'view', 'company.detail')).toBe(false);
      expect(permissions.visible({}, 'company.list')).toBe(false);
      expect(permissions.canAction({}, 'company.detail', 'edit_instances')).toBe(false);
    });

    it('should return false when layouts are missing in config', () => {
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: 'company.detail' }],
          },
        },
      });

      const admin = { roles: ['admin'] };
      expect(staticPermissions.visible(admin, 'company.list')).toBe(false);
      expect(staticPermissions.canAction(admin, 'company.detail', 'edit_instances')).toBe(false);
    });

    it('should return false when view has no show or actions definitions', () => {
      const staticPermissions = new Permissions({
        config: {
          roles: {
            admin: [{ action: 'view', resource: 'company.detail' }],
          },
          layouts: {
            company: {
              detail: {},
            },
          },
        },
      });

      const admin = { roles: ['admin'] };
      expect(staticPermissions.visible(admin, 'company.detail')).toBe(false);
      expect(staticPermissions.canAction(admin, 'company.detail', 'edit_instances')).toBe(false);
    });
  });

  describe('config helpers', () => {
    it('should create a permission config preserving layouts', () => {
      const layouts = {
        company: {
          list: {
            show: ['admin'],
            actions: { create: ['admin'] },
          },
        },
      };

      const config = createPermissionConfigFromLayouts(layouts);
      expect(config.roles).toEqual({});
      expect(config.layouts).toEqual(layouts);
    });
  });
});
