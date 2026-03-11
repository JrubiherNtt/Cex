import { PermissionConfig } from './types';

/**
 * Convert the hierarchical layouts structure from permisos.jsonc
 * into a flat PermissionConfig optimized for the Permissions evaluator.
 *
 * Input structure:
 * {
 *   layouts: {
 *     company: {
 *       list: { actions: { create: ["admin"] }, show: ["admin", "user"] },
 *       detail: { actions: { edit: ["admin"] }, show: ["admin"] }
 *     }
 *   }
 * }
 *
 * This format is designed to be evaluated via the Permissions.visible()
 * and Permissions.canAction() methods.
 */
export function createPermissionConfigFromLayouts(layouts: any): PermissionConfig {
  // The config stores the raw layouts structure so that
  // visible() and canAction() can navigate it at runtime.
  return {
    roles: {},
    layouts, // keep the original structure for tree navigation
  };
}

/**
 * Example permissions configuration matching your permisos.jsonc structure.
 * This is auto-generated but you can extend/modify it as needed.
 */
export const defaultPermissionConfig: PermissionConfig = {
  roles: {},
  layouts: {
    company: {
      list: {
        actions: {
          create: ['admin'],
        },
        show: ['admin', 'company_owner', 'company_member', 'app_owner', 'app_member', 'anonymous'],
      },
      detail: {
        actions: {
          see_instances: ['admin', 'company_owner', 'company_member'],
          edit_instances: ['admin', 'company_owner'],
          edit_owners: ['admin'],
          show_banner: ['anonymous'],
        },
        show: ['admin', 'company_owner', 'company_member', 'app_owner', 'app_member', 'anonymous'],
      },
      team: {
        list: {
          actions: {
            create: ['admin', 'company_owner'],
          },
          show: ['admin', 'company_owner', 'company_member', 'team_owner', 'team_member'],
        },
        detail: {
          actions: {
            edit_instances: ['admin', 'company_owner'],
            see_instances: ['admin', 'company_owner', 'team_owner', 'team_member'],
            edit_owners: ['admin', 'company_owner'],
            show_banner: ['anonymous'],
          },
          show: ['admin', 'company_owner', 'company_member', 'team_owner', 'team_member'],
        },
        members_list: {
          actions: {
            add_member: ['admin', 'team_owner'],
            remove_member: ['admin', 'team_owner'],
            show_banner: ['anonymous'],
          },
          show: ['admin', 'company_owner', 'team_owner', 'team_member'],
        },
      },
    },
    applications: {
      list: {
        actions: {
          create: ['admin', 'company_owner'],
          my_applications: ['app_owner', 'app_member'],
        },
        show: ['admin', 'company_owner', 'company_member', 'app_owner', 'app_member', 'anonymous'],
      },
      detail: {
        actions: {
          edit_instances: ['admin', 'company_owner'],
          see_instances: ['admin', 'company_owner', 'app_owner', 'app_member'],
          edit_owners: ['admin', 'company_owner'],
          show_banner: ['company_member', 'anonymous'],
        },
        show: ['admin', 'company_owner', 'company_member', 'app_owner', 'app_member', 'anonymous'],
      },
      team: {
        list: {
          actions: {
            create: ['admin', 'app_owner'],
            action: ['admin', 'app_owner'],
          },
          show: ['admin', 'company_owner', 'app_owner', 'app_member'],
        },
      },
      components: {
        list: {
          actions: {
            create: ['admin', 'app_owner', 'app_member'],
          },
          show: ['admin', 'company_owner', 'app_owner', 'app_member'],
        },
        detail: {
          show: ['admin', 'company_owner', 'app_owner', 'app_member'],
        },
      },
      infrastructure: {
        show: ['admin', 'company_owner', 'app_owner', 'app_member'],
      },
      integrations: {
        show: ['admin', 'company_owner', 'app_owner', 'app_member'],
      },
      exceptions: {
        show: ['admin', 'company_owner', 'app_owner', 'app_member'],
      },
      releases: {
        show: ['admin', 'company_owner', 'app_owner', 'app_member'],
      },
      security: {
        show: ['admin', 'company_owner', 'app_owner', 'app_member'],
      },
    },
  } as any,
};
