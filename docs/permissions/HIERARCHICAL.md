# Hierarchical Permissions Guide

This guide explains how to use the permission system with nested affiliations (companies → applications → teams).

## User Structure

Users have a hierarchical structure with roles at multiple levels:

```typescript
{
  id: "user-1",
  name: "John",
  email: "john@example.com",
  globalRoles: ["user", "admin"],
  companies: [
    {
      id: "company-1",
      name: "Acme Corp",
      roles: ["company_owner"],
      applications: [
        {
          id: "app-1",
          name: "Dashboard",
          roles: ["app_owner"],
          teams: [
            {
              id: "team-1",
              name: "Frontend",
              roles: ["team_owner"]
            }
          ]
        }
      ]
    }
  ]
}
```

## Setup

### 1. Create Affiliation Evaluator

```typescript
import {
  PermissionsProvider,
  createAffiliationEvaluator,
} from '@cex/permissions';
import { defaultPermissionConfig } from '@cex/permissions/config';

const evaluator = createAffiliationEvaluator();

<PermissionsProvider
  config={defaultPermissionConfig}
  user={userWithAffiliations}
  evaluator={evaluator}
>
  <App />
</PermissionsProvider>;
```

### 2. Use Hierarchical Hook

```typescript
import { useHierarchicalPermissions, createContext } from '@cex/permissions';

function MyComponent() {
  const {
    getRoles,
    getCompanies,
    getApplicationsInCompany,
    canAccessCompany,
    canAccessApplication,
    canActionInApplication,
    user,
  } = useHierarchicalPermissions();

  // Get all companies
  const companies = getCompanies();

  // Get apps in a company
  const apps = getApplicationsInCompany('company-1');

  // Get effective roles in context
  const rolesInCompany = getRoles({
    companyId: 'company-1',
  });

  const rolesInApp = getRoles({
    companyId: 'company-1',
    applicationId: 'app-1',
  });

  return (
    <>
      {companies.map((company) => (
        <div key={company.id}>
          <h2>{company.name}</h2>
          <p>Roles: {company.roles.join(', ')}</p>
        </div>
      ))}
    </>
  );
}
```

## Methods Reference

### `useHierarchicalPermissions()`

#### `getRoles(context?: PermissionContext): string[]`

Get all applicable roles for a user in a given context.

```typescript
const globalRoles = getRoles();
// ["user", "admin"]

const companyRoles = getRoles({ companyId: 'company-1' });
// ["user", "admin", "company_owner"]

const appRoles = getRoles({
  companyId: 'company-1',
  applicationId: 'app-1',
});
// ["user", "admin", "company_owner", "app_owner"]
```

#### `hasAffiliation(type: 'company' | 'application' | 'team', id: string): boolean`

Check if user has affiliation with a specific entity.

```typescript
const hasCompany = hasAffiliation('company', 'company-1'); // true
const hasApp = hasAffiliation('application', 'app-1'); // true
const hasTeam = hasAffiliation('team', 'team-1'); // true
```

#### `getCompanies(): UserAffiliation[]`

Get all companies the user has access to.

```typescript
const companies = getCompanies();
companies.forEach((company) => {
  console.log(company.name, company.roles);
});
```

#### `getApplicationsInCompany(companyId: string): ApplicationAffiliation[]`

Get all applications within a specific company.

```typescript
const apps = getApplicationsInCompany('company-1');
apps.forEach((app) => {
  console.log(app.name, app.roles);
});
```

#### `canAccessCompany(companyId: string): boolean`

Check if user can access a specific company.

```typescript
if (canAccessCompany('company-1')) {
  // Show company
}
```

#### `canAccessApplication(applicationId: string): boolean`

Check if user can access a specific application (anywhere in hierarchy).

```typescript
if (canAccessApplication('app-1')) {
  // Show application
}
```

#### `canActionInApplication(applicationId: string, companyId?: string, action: string): boolean`

Check if user can perform an action in an application context.

```typescript
if (canActionInApplication('app-1', 'company-1', 'edit_instances')) {
  // Show edit button
}
```

## Usage Examples

### Example 1: Render Company List

```typescript
function CompanyList() {
  const { getCompanies } = useHierarchicalPermissions();

  const companies = getCompanies();

  return (
    <ul>
      {companies.map((company) => (
        <li key={company.id}>
          {company.name}
          <small> ({company.roles.join(', ')})</small>
        </li>
      ))}
    </ul>
  );
}
```

### Example 2: Filter Applications by Company

```typescript
function ApplicationList({ companyId }: { companyId: string }) {
  const { getApplicationsInCompany, getRoles } =
    useHierarchicalPermissions();

  const apps = getApplicationsInCompany(companyId);
  const rolesInContext = getRoles({ companyId });

  return (
    <div>
      <p>Your roles: {rolesInContext.join(', ')}</p>
      <ul>
        {apps.map((app) => (
          <li key={app.id}>{app.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Dynamic Navigation

```typescript
function NavigationMenu() {
  const { getCompanies, getApplicationsInCompany } =
    useHierarchicalPermissions();

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const companies = getCompanies();
  const apps = selectedCompany
    ? getApplicationsInCompany(selectedCompany)
    : [];

  return (
    <>
      <h3>Companies</h3>
      {companies.map((company) => (
        <button
          key={company.id}
          onClick={() => setSelectedCompany(company.id)}
        >
          {company.name}
        </button>
      ))}

      {selectedCompany && (
        <>
          <h3>Applications</h3>
          {apps.map((app) => (
            <button key={app.id}>{app.name}</button>
          ))}
        </>
      )}
    </>
  );
}
```

## Type Reference

### `UserWithAffiliations`

```typescript
interface UserWithAffiliations {
  id: string;
  name: string;
  email: string;
  globalRoles: string[];
  companies?: UserAffiliation[];
  applications?: ApplicationAffiliation[];
  teams?: TeamAffiliation[];
}
```

### `UserAffiliation`

```typescript
interface UserAffiliation {
  id: string;
  name: string;
  roles: string[];
  applications?: ApplicationAffiliation[];
}
```

### `ApplicationAffiliation`

```typescript
interface ApplicationAffiliation {
  id: string;
  name: string;
  roles: string[];
  teams?: TeamAffiliation[];
}
```

### `PermissionContext`

```typescript
interface PermissionContext {
  companyId?: string;
  applicationId?: string;
  teamId?: string;
  [key: string]: any; // Allow custom attributes
}
```

## Best Practices

1. **Always provide context** when checking permissions in nested structures
2. **Cache role lookups** if checking the same context multiple times
3. **Use `canAccessX` methods** to filter data before rendering
4. **Combine with `<ShowIf>`** for conditional rendering
5. **Pass context through navigation** (URL params, state, etc.)

## Troubleshooting

### Roles not resolving correctly

- Ensure user structure matches `UserWithAffiliations` interface
- Check that IDs in context match actual affiliation IDs
- Verify evaluator is properly initialized

### Applications not appearing

- Confirm user has the application in their affiliations
- Check if application is nested within expected company
- Use `hasAffiliation` to verify access first

### Context not working

- Make sure `PermissionContext` is passed to all relevant methods
- Verify `createAffiliationEvaluator` is used as the evaluator
