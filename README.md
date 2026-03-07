# @cex/permissions

An RBAC/ABAC permission system library for React applications.

## Features

- ✅ **RBAC** — Role-Based Access Control
- ✅ **ABAC** — Attribute-Based Access Control (extensible)
- ✅ **React Hooks** — `usePermissions()` for easy integration
- ✅ **Components** — `<ShowIf>` for conditional rendering
- ✅ **TypeScript** — Full type safety
- ✅ **Hierarchical** — Support for nested resource paths
- ✅ **Flexible** — Works with any permission schema

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

function App() {
  const user = {
    id: 'user-123',
    name: 'John Doe',
    roles: ['company_owner', 'app_member'],
  };

  return (
    <PermissionsProvider config={defaultPermissionConfig} user={user}>
      <YourComponent />
    </PermissionsProvider>
  );
}
```

### 2. Use the hook or component

```tsx
import { usePermissions, ShowIf } from '@cex/permissions';

function Dashboard() {
  const { canAction, visible } = usePermissions();

  if (!visible('company.list')) {
    return <p>No access</p>;
  }

  return (
    <>
      <h1>Companies</h1>
      
      <ShowIf componentId="company.detail" action="edit_instances">
        <button>Edit</button>
      </ShowIf>
    </>
  );
}
```

## Documentation

See [src/permissions/USAGE.md](src/permissions/USAGE.md) for comprehensive API documentation and examples.

## Development

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
