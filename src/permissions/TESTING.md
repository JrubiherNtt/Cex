# Testing Permissions Guide

Esta guía muestra cómo escribir tests exhaustivos para el sistema de permisos en diferentes niveles.

## 1. Unit Tests para Core Permissions

### 1.1 Básicos - RBAC Estático

```typescript
// __tests__/permissions.unit.test.ts
import { describe, it, expect } from 'vitest';
import { Permissions } from '../permissions/index';
import { defaultPermissionConfig } from '../permissions/config';

describe('Permissions - Basic RBAC', () => {
  const permissions = new Permissions(defaultPermissionConfig);

  describe('can()', () => {
    it('should allow action for user with required role', () => {
      const result = permissions.can(
        {
          roles: ['company_owner'],
        },
        'edit',
        'company.detail'
      );

      expect(result).toBe(true);
    });

    it('should deny action for user without required role', () => {
      const result = permissions.can(
        {
          roles: ['company_member'],
        },
        'edit',
        'company.detail'
      );

      expect(result).toBe(false);
    });
  });

  describe('visible()', () => {
    it('should show component if user has access', () => {
      const result = permissions.visible(
        {
          roles: ['company_owner'],
        },
        'company.detail'
      );

      expect(result).toBe(true);
    });

    it('should hide component if user lacks access', () => {
      const result = permissions.visible(
        {
          roles: ['guest'],
        },
        'company.detail'
      );

      expect(result).toBe(false);
    });
  });

  describe('canAction()', () => {
    it('should allow specific action in component', () => {
      const result = permissions.canAction(
        { roles: ['company_owner'] },
        'company.detail',
        'edit_instances'
      );

      expect(result).toBe(true);
    });

    it('should deny action not in role permissions', () => {
      const result = permissions.canAction(
        { roles: ['company_member'] },
        'company.detail',
        'edit_instances'
      );

      expect(result).toBe(false);
    });
  });
});
```

### 1.2 ABAC - Evaluadores Personalizados

```typescript
// __tests__/permissions.abac.test.ts

describe('Permissions - ABAC (Attribute-Based)', () => {
  const config = {
    layouts: {
      applications: {
        show: ['user'],
        actions: {
          create: (user: any) => {
            // Solo admin o si es propietario de compañía
            return user.roles.includes('admin') ||
              user.roles.includes('company_owner');
          },
        },
      },
    },
  };

  const permissions = new Permissions(config);

  it('should evaluate dynamic function for action', () => {
    const admin = { roles: ['admin'] };
    const member = { roles: ['user'] };

    expect(permissions.canAction(admin, 'applications', 'create')).toBe(true);
    expect(permissions.canAction(member, 'applications', 'create')).toBe(
      false
    );
  });

  it('should handle complex conditions', () => {
    const config = {
      layouts: {
        'company.detail': {
          actions: {
            delete: (user: any) => {
              // Solo super_admin puede borrar
              return user.roles.includes('super_admin');
            },
          },
        },
      },
    };

    const permissions = new Permissions(config);
    const user = { roles: ['company_owner'] };

    expect(permissions.canAction(user, 'company.detail', 'delete')).toBe(
      false
    );
  });
});
```

## 2. Integration Tests - Hierarchical Permissions

### 2.1 Context-Aware Permission Resolution

```typescript
// __tests__/hierarchical.integration.test.ts
import { describe, it, expect } from 'vitest';
import { createAffiliationEvaluator } from '../permissions/hierarchical';
import { getRolesForContext } from '../permissions/affiliations';
import type { UserWithAffiliations } from '../permissions/affiliations';

describe('Hierarchical Permissions Integration', () => {
  const evaluator = createAffiliationEvaluator();

  const mockUser: UserWithAffiliations = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    globalRoles: ['user'],
    companies: [
      {
        id: 'company-1',
        name: 'Acme Corp',
        roles: ['company_owner'],
        applications: [
          {
            id: 'app-1',
            name: 'Dashboard',
            roles: ['app_member'],
            teams: [
              {
                id: 'team-1',
                name: 'Engineering',
                roles: ['team_lead'],
              },
            ],
          },
        ],
      },
    ],
  };

  it('should resolve roles at global level', () => {
    const roles = getRolesForContext(mockUser);
    expect(roles).toContain('user');
  });

  it('should resolve roles at company level', () => {
    const roles = getRolesForContext(mockUser, {
      companyId: 'company-1',
    });
    expect(roles).toContain('company_owner');
  });

  it('should resolve roles at application level', () => {
    const roles = getRolesForContext(mockUser, {
      companyId: 'company-1',
      applicationId: 'app-1',
    });
    expect(roles).toContain('app_member');
  });

  it('should resolve roles at team level', () => {
    const roles = getRolesForContext(mockUser, {
      companyId: 'company-1',
      applicationId: 'app-1',
      teamId: 'team-1',
    });
    expect(roles).toContain('team_lead');
  });

  it('should aggregate roles from all levels', () => {
    const roles = getRolesForContext(mockUser, {
      companyId: 'company-1',
      applicationId: 'app-1',
    });
    // Debe incluir roles globales, de compañía, de app
    expect(roles).toContain('user'); // global
    expect(roles).toContain('company_owner'); // company level
    expect(roles).toContain('app_member'); // app level
  });
});
```

### 2.2 Permission Denied Access

```typescript
// __tests__/access-denial.test.ts

describe('Access Denial Cases', () => {
  const mockUser: UserWithAffiliations = {
    id: 'user-2',
    name: 'Jane',
    email: 'jane@example.com',
    globalRoles: ['user'],
    companies: [
      {
        id: 'company-1',
        name: 'Acme',
        roles: ['company_member'],
        applications: [],
      },
    ],
  };

  it('should deny access to company not in affiliations', () => {
    const { canAccessCompany } = useHierarchicalPermissions({
      permanentUser: mockUser,
    });

    expect(canAccessCompany('company-999')).toBe(false);
  });

  it('should deny access to application not in company', () => {
    const user = {
      ...mockUser,
      companies: [
        {
          ...mockUser.companies[0],
          applications: [
            {
              id: 'app-1',
              name: 'Dashboard',
              roles: ['app_member'],
              teams: [],
            },
          ],
        },
      ],
    };

    const { canAccessApplication } = useHierarchicalPermissions({
      permanentUser: user,
    });

    // app-999 no existe en company-1
    expect(canAccessApplication('app-999')).toBe(false);
  });

  it('should deny action if user lacks role in context', () => {
    const { canActionInApplication } = useHierarchicalPermissions({
      permanentUser: mockUser,
    });

    // user solo tiene role 'company_member' en company-1
    // Las acciones "edit_instances" requieren "company_owner"
    expect(
      canActionInApplication('edit_instances', 'company-1')
    ).toBe(false);
  });
});
```

## 3. React Component Tests

### 3.1 Testing `<ShowIf>` Component

```typescript
// __tests__/ShowIf.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowIf } from '../permissions/react';
import { PermissionsProvider } from '../permissions/react';
import { defaultPermissionConfig } from '../permissions/config';

describe('ShowIf Component', () => {
  const user = {
    id: 'test-user',
    roles: ['company_owner'],
  };

  it('should render children when user has permission', () => {
    render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={user}
      >
        <ShowIf componentId="company.detail" action="edit">
          <button>Edit Company</button>
        </ShowIf>
      </PermissionsProvider>
    );

    expect(screen.getByText('Edit Company')).toBeInTheDocument();
  });

  it('should not render children when user lacks permission', () => {
    const limitedUser = {
      id: 'test-user',
      roles: ['guest'],
    };

    render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={limitedUser}
      >
        <ShowIf componentId="company.detail" action="edit">
          <button>Edit Company</button>
        </ShowIf>
      </PermissionsProvider>
    );

    expect(screen.queryByText('Edit Company')).not.toBeInTheDocument();
  });

  it('should support fallback prop', () => {
    const limitedUser = {
      id: 'test-user',
      roles: ['guest'],
    };

    render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={limitedUser}
      >
        <ShowIf
          componentId="company.detail"
          action="edit"
          fallback={<p>No access</p>}
        >
          <button>Edit Company</button>
        </ShowIf>
      </PermissionsProvider>
    );

    expect(screen.getByText('No access')).toBeInTheDocument();
  });
});
```

### 3.2 Testing Custom Hooks

```typescript
// __tests__/useHierarchicalPermissions.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHierarchicalPermissions } from '../permissions/useHierarchicalPermissions';
import { PermissionsProvider } from '../permissions/react';
import type { UserWithAffiliations } from '../permissions/affiliations';

describe('useHierarchicalPermissions Hook', () => {
  const mockUser: UserWithAffiliations = {
    id: 'user-1',
    name: 'John',
    email: 'john@example.com',
    globalRoles: ['user'],
    companies: [
      {
        id: 'company-1',
        name: 'Acme',
        roles: ['company_owner'],
        applications: [
          {
            id: 'app-1',
            name: 'Dashboard',
            roles: ['app_member'],
            teams: [],
          },
        ],
      },
      {
        id: 'company-2',
        name: 'TechCorp',
        roles: ['company_member'],
        applications: [],
      },
    ],
  };

  it('should return all accessible companies', () => {
    const wrapper = ({ children }: any) => (
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={mockUser}
      >
        {children}
      </PermissionsProvider>
    );

    const { result } = renderHook(() => useHierarchicalPermissions(), {
      wrapper,
    });

    const companies = result.current.getCompanies();
    expect(companies).toHaveLength(2);
    expect(companies.map((c) => c.id)).toEqual(['company-1', 'company-2']);
  });

  it('should return applications in company', () => {
    const wrapper = ({ children }: any) => (
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={mockUser}
      >
        {children}
      </PermissionsProvider>
    );

    const { result } = renderHook(() => useHierarchicalPermissions(), {
      wrapper,
    });

    const apps = result.current.getApplicationsInCompany('company-1');
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe('app-1');
  });

  it('should return empty array for non-existent company', () => {
    const wrapper = ({ children }: any) => (
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={mockUser}
      >
        {children}
      </PermissionsProvider>
    );

    const { result } = renderHook(() => useHierarchicalPermissions(), {
      wrapper,
    });

    const apps = result.current.getApplicationsInCompany('company-999');
    expect(apps).toEqual([]);
  });
});
```

## 4. E2E Tests (MFE Scenarios)

### 4.1 Scenario: Create Application

```typescript
// __tests__/e2e/create-application.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationsMFE } from '../../permissions/examples/mfe-examples';
import { PermissionsProvider } from '../../permissions/react';
import { defaultPermissionConfig } from '../../permissions/config';
import type { UserWithAffiliations } from '../../permissions/affiliations';

describe('E2E: Create Application Flow', () => {
  const ownerUser: UserWithAffiliations = {
    id: 'user-owner',
    name: 'Owner',
    email: 'owner@example.com',
    globalRoles: [],
    companies: [
      {
        id: 'company-1',
        name: 'Acme Corp',
        roles: ['company_owner'],
        applications: [
          {
            id: 'existing-app',
            name: 'Dashboard',
            roles: ['app_member'],
            teams: [],
          },
        ],
      },
    ],
  };

  it('should allow company owner to create application', async () => {
    const user = userEvent.setup();

    render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={ownerUser}
      >
        <ApplicationsMFE companyId="company-1" />
      </PermissionsProvider>
    );

    // Verificar que el botón "Crear" está visible
    const createButton = screen.getByText('Crear Aplicación');
    expect(createButton).toBeInTheDocument();
    expect(createButton).not.toBeDisabled();

    // Interactuar con el formulario
    await user.click(createButton);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nombre de la app')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Nombre de la app');
    await user.type(input, 'New Dashboard');

    const submitButton = screen.getByText('Crear');
    await user.click(submitButton);

    // Verificar que se submiteó
    await waitFor(() => {
      expect(screen.getByText('New Dashboard')).toBeInTheDocument();
    });
  });

  it('should prevent member from creating application', async () => {
    const memberUser = {
      ...ownerUser,
      companies: [
        {
          ...ownerUser.companies[0],
          roles: ['company_member'],
        },
      ],
    };

    render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={memberUser}
      >
        <ApplicationsMFE companyId="company-1" />
      </PermissionsProvider>
    );

    // Botón "Crear" no debe estar visible
    const createButton = screen.queryByText('Crear Aplicación');
    expect(createButton).not.toBeInTheDocument();
  });
});
```

### 4.2 Scenario: Change Company Context

```typescript
// __tests__/e2e/change-context.test.ts

describe('E2E: Change Company Context', () => {
  const user: UserWithAffiliations = {
    id: 'user-1',
    name: 'User',
    email: 'user@example.com',
    globalRoles: [],
    companies: [
      {
        id: 'company-1',
        name: 'Company A',
        roles: ['company_owner'],
        applications: [
          {
            id: 'app-1a',
            name: 'Dashboard A',
            roles: ['app_member'],
            teams: [],
          },
        ],
      },
      {
        id: 'company-2',
        name: 'Company B',
        roles: ['company_member'],
        applications: [
          {
            id: 'app-2b',
            name: 'Dashboard B',
            roles: ['app_member'],
            teams: [],
          },
        ],
      },
    ],
  };

  it('should show different apps when switching company', async () => {
    const userAction = userEvent.setup();

    render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={user}
      >
        <CompanySelector onSelect={setSelectedCompany} />
        <ApplicationsMFE companyId={selectedCompany} />
      </PermissionsProvider>
    );

    // Verificar que se muestran apps de company-1
    expect(screen.getByText('Dashboard A')).toBeInTheDocument();

    // Cambiar a company-2
    const selector = screen.getByDisplayValue('Company A');
    await userAction.selectOptions(selector, 'Company B');

    // Verificar que se muestran apps de company-2
    await waitFor(() => {
      expect(screen.getByText('Dashboard B')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard A')).not.toBeInTheDocument();
    });
  });

  it('should update button visibility when changing context', async () => {
    const userAction = userEvent.setup();

    const { rerender } = render(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={user}
      >
        <ApplicationsMFE companyId="company-1" />
      </PermissionsProvider>
    );

    // En company-1, el usuario es propietario → debe ver botón "Crear"
    expect(screen.getByText('Crear Aplicación')).toBeInTheDocument();

    // Cambiar a company-2
    rerender(
      <PermissionsProvider
        config={defaultPermissionConfig}
        user={user}
      >
        <ApplicationsMFE companyId="company-2" />
      </PermissionsProvider>
    );

    // En company-2, el usuario es miembro → NO debe ver botón "Crear"
    expect(
      screen.queryByText('Crear Aplicación')
    ).not.toBeInTheDocument();
  });
});
```

## 5. Performance Tests

### 5.1 Permission Resolution Performance

```typescript
// __tests__/performance.test.ts
import { describe, it, expect } from 'vitest';
import { getRolesForContext } from '../permissions/affiliations';
import type { UserWithAffiliations } from '../permissions/affiliations';

describe('Permissions Performance', () => {
  // Crear usuario con muchas afiliaciones
  const createLargeUser = (): UserWithAffiliations => {
    const companies = Array.from({ length: 100 }, (_, i) => ({
      id: `company-${i}`,
      name: `Company ${i}`,
      roles: ['company_member'],
      applications: Array.from({ length: 10 }, (_, j) => ({
        id: `app-${i}-${j}`,
        name: `App ${i}-${j}`,
        roles: ['app_member'],
        teams: Array.from({ length: 5 }, (_, k) => ({
          id: `team-${i}-${j}-${k}`,
          name: `Team ${i}-${j}-${k}`,
          roles: ['team_member'],
        })),
      })),
    }));

    return {
      id: 'user-1',
      name: 'Large User',
      email: 'user@example.com',
      globalRoles: ['user'],
      companies,
    };
  };

  it('should resolve roles quickly even with large affiliation tree', () => {
    const user = createLargeUser();
    const start = performance.now();

    // Ejecutar 1000 resoluciones
    for (let i = 0; i < 1000; i++) {
      getRolesForContext(user, {
        companyId: 'company-50',
        applicationId: 'app-50-5',
        teamId: 'team-50-5-2',
      });
    }

    const end = performance.now();
    const avgTime = (end - start) / 1000;

    // Debe ser muy rápido (< 1ms por resolución)
    expect(avgTime).toBeLessThan(1);
  });
});
```

## Checklist de Testing

- [ ] Unit tests para core RBAC logic
- [ ] Unit tests para ABAC evaluadores
- [ ] Integration tests para contexto jerárquico
- [ ] Integration tests para denial cases
- [ ] Tests de componentes React (`<ShowIf>`, hooks)
- [ ] E2E tests para flujos completos
- [ ] Tests de cambio de contexto
- [ ] Performance tests para árboles grandes
- [ ] Coverage >= 80% en permisos
- [ ] Tests de manejo de errores
- [ ] Mocks para llamadas API
- [ ] Documentation de test patterns

