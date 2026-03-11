# @cex/permissions

An RBAC/ABAC permission system library for React applications with hierarchical affiliations support. Designed for complex permission models with companies → applications → teams structure.

## Features

- ✅ **RBAC** — Role-Based Access Control with static roles
- ✅ **ABAC** — Attribute-Based Access Control with custom evaluators
- ✅ **Hierarchical** — Multi-level role resolution (global → company → app → team)
- ✅ **React Hooks** — `usePermissions()` and `useHierarchicalPermissions()` for integration
- ✅ **Components** — `<ShowIf>` for conditional rendering
- ✅ **TypeScript** — Full type safety with strict mode
- ✅ **Micro-frontends** — Shell + MFE integration patterns included
- ✅ **API Integration** — Server-side validation, token management, caching
- ✅ **Comprehensive Tests** — 35+ tests covering all scenarios

## Quick Links

📖 **[Main Documentation](src/permissions/USAGE.md)** — Basic and advanced usage patterns

🏗️ **[Architecture](ARCHITECTURE.md)** — System design and data models

🔐 **[Hierarchical Permissions](src/permissions/HIERARCHICAL.md)** — Context-aware role resolution

🔧 **[MFE Integration](src/permissions/MFE-INTEGRATION.md)** — Shell + Micro-frontends integration (recommended)

🌐 **[API Integration](src/permissions/API-INTEGRATION.md)** — Server connection, token management, caching

✅ **[Testing Guide](src/permissions/TESTING.md)** — Unit, integration, and E2E testing

## Installation

### Using pnpm (recommended)

```bash
pnpm add @cex/permissions
```

### Using npm

```bash
npm install @cex/permissions
```

### Using yarn

```bash
yarn add @cex/permissions
```

## Quick Start

### 1. Wrap your app with the provider

```tsx
import { PermissionsProvider } from '@cex/permissions';
import { defaultPermissionConfig } from '@cex/permissions/config';
import { createAffiliationEvaluator } from '@cex/permissions/hierarchical';

function App() {
  const user = {
    id: 'user-123',
    name: 'John Doe',
    globalRoles: ['user'],
    companies: [
      {
        id: 'company-1',
        name: 'Acme Corp',
        roles: ['company_owner'],
        applications: [],
      },
    ],
  };

  return (
    <PermissionsProvider 
      config={defaultPermissionConfig} 
      user={user}
      evaluator={createAffiliationEvaluator()}
    >
      <YourComponent />
    </PermissionsProvider>
  );
}
```

### 2. Use the hook for hierarchical permissions

```tsx
import { useHierarchicalPermissions, ShowIf } from '@cex/permissions';

function CompanyDetail({ companyId }) {
  const { 
    getRoles, 
    canAccessCompany,
    canAction 
  } = useHierarchicalPermissions();

  if (!canAccessCompany(companyId)) {
    return <p>Access Denied</p>;
  }

  const roles = getRoles({ companyId });

  return (
    <>
      <h1>Company Details</h1>
      <p>Your roles: {roles.join(', ')}</p>

      <ShowIf componentId="company.detail" action="edit">
        <button>Edit Company</button>
      </ShowIf>

      {roles.includes('company_owner') && (
        <AdminPanel companyId={companyId} />
      )}
    </>
  );
}
```

## Working with Micro-Frontends

For Shell + MFE architecture, see [MFE-INTEGRATION.md](src/permissions/MFE-INTEGRATION.md).

**Example Shell setup:**

```tsx
<PermissionsProvider 
  user={user} 
  config={config}
  evaluator={createAffiliationEvaluator()}
>
  <Navigation /> {/* Company/App selector */}
  <MFEContainer /> {/* Loads MFEs with context */}
</PermissionsProvider>
```

**Example MFE usage:**

```tsx
function ApplicationsMFE({ companyId }) {
  const { getApplicationsInCompany, getRoles } = useHierarchicalPermissions();
  
  const apps = getApplicationsInCompany(companyId);
  const canCreate = getRoles({ companyId }).includes('company_owner');
  
  return (
    <>
      {apps.map(app => <AppCard key={app.id} app={app} />)}
      {canCreate && <button>Create App</button>}
    </>
  );
}
```

## API Integration

For connecting to real APIs with token management and server validation:

- See [API-INTEGRATION.md](src/permissions/API-INTEGRATION.md)
- Includes: user fetching, token refresh, server-side middleware, caching, WebSocket updates

## Testing

For comprehensive testing patterns:

- See [TESTING.md](src/permissions/TESTING.md)
- Includes: unit tests, integration tests, E2E tests, performance tests

## Documentation

Full API reference and examples: [src/permissions/USAGE.md](src/permissions/USAGE.md)

## Development

### Proof of Concept (POC)

A minimal demo component lives at `src/permissions/examples/poc.tsx`. You can import it directly in a React application or the example project to quickly verify permission behaviors.

```tsx
import POC from './src/permissions/examples/poc';

function App() {
  return <POC />;
}
```

### Install dependencies

```bash
pnpm install
```

### Development server

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Run tests

```bash
pnpm test
```

### Watch mode for TypeScript

```bash
pnpm build:watch
```

## License

MIT
