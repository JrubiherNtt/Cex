# 🚀 Quick Start Guide

Welcome to **@cex/permissions** — A production-ready RBAC/ABAC permission system for React applications.

## 📌 What You Have

- ✅ **Core Library** — TypeScript permission engine with RBAC + ABAC support
- ✅ **35 Passing Tests** — Comprehensive test coverage
- ✅ **Hierarchical Permissions** — Multi-level role resolution (global → company → app → team)
- ✅ **Shell + MFE Ready** — Complete integration patterns for micro-frontends
- ✅ **API Integration Guide** — Server authentication, caching, real-time updates
- ✅ **6 Documentation Guides** — Everything you need

---

## 🎯 Start Here Based on Your Need

### I'm building a Shell + Micro-Frontends Architecture

👉 **Start with:** [MFE-INTEGRATION.md](src/permissions/MFE-INTEGRATION.md) (15 min read)

This document shows you:
- How Shell and MFEs communicate permissions
- 3 communication patterns (URL, Context, EventBus)
- Real-world examples (companies, applications, teams)
- Chained MFEs: Shell -> MFE1 -> MFE2 and Shell -> MFE3 pattern (see shell-chain-example.tsx)
- Ready-to-use code snippets

**Example:**
```tsx
// In your Shell app
<PermissionsProvider 
  user={user} 
  evaluator={createAffiliationEvaluator()}
>
  <Navigation /> {/* Company/App selector */}
  <MFEContainer /> {/* Renders MFEs with permissions */}
</PermissionsProvider>
```

---

### I need to understand the permission system

👉 **Start with:** [USAGE.md](src/permissions/USAGE.md) (20 min read)

This covers:
- Basic RBAC usage
- Advanced ABAC patterns
- React hooks and components
- Configuration examples

---

### I need to connect to a server API

👉 **Start with:** [API-INTEGRATION.md](src/permissions/API-INTEGRATION.md) (25 min read)

This shows:
- Fetching user data from `/api/v1/me`
- Token management and refresh
- Server-side middleware (Express.js example)
- Permission caching with invalidation
- WebSocket for real-time updates

---

### I need to understand the hierarchy system

👉 **Start with:** [HIERARCHICAL.md](src/permissions/HIERARCHICAL.md) (20 min read)

This explains:
- How roles are resolved across levels
- Context propagation
- Real-world usage patterns
- Edge cases handling

---

### I need to test permissions

👉 **Start with:** [TESTING.md](src/permissions/TESTING.md) (20 min read)

This includes:
- Unit tests for RBAC/ABAC
- Integration tests for hierarchy
- React component tests
- E2E test scenarios
- Performance tests

---

## 🏗️ Understanding the Architecture

```
┌─────────────────────────────────────┐
│   Shell App                         │
│  (loads user + context selector)    │
└──────────────┬──────────────────────┘
               │
               ├─ Company: Acme Corp
               ├─ Application: Dashboard
               │
               ├─ PermissionsProvider
               │  (evaluator: createAffiliationEvaluator())
               │
┌──────────────▼──────────────────────┐
│   MFE Container                     │
│  (receives company + app context)   │
└──────────────┬──────────────────────┘
       ┌───────┴────────┐
       │                │
    MFE 1            MFE 2
  Companies      Applications
```

**User Structure:**
```typescript
User {
  globalRoles: ['user']
  companies: [
    {
      id: 'company-1'
      roles: ['company_owner']          // Role at company level
      applications: [
        {
          id: 'app-1'
          roles: ['app_member']         // Role at app level
          teams: [
            {
              id: 'team-1'
              roles: ['team_lead']       // Role at team level
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 💻 Code Examples

### Basic Setup

```tsx
import { PermissionsProvider, useHierarchicalPermissions, ShowIf } from '@cex/permissions';
import { defaultPermissionConfig } from '@cex/permissions/config';
import { createAffiliationEvaluator } from '@cex/permissions/hierarchical';

function App() {
  const user = {
    id: 'user-1',
    globalRoles: ['user'],
    companies: [
      {
        id: 'company-1',
        roles: ['company_owner'],
        applications: [],
      },
    ],
  };

  return (
    <PermissionsProvider
      user={user}
      config={defaultPermissionConfig}
      evaluator={createAffiliationEvaluator()}
    >
      <Dashboard />
    </PermissionsProvider>
  );
}
```

### Using in a Component

```tsx
function CompanyDetail({ companyId }) {
  const { getRoles, canAccessCompany, canAction } = useHierarchicalPermissions();

  if (!canAccessCompany(companyId)) {
    return <p>Access Denied</p>;
  }

  const roles = getRoles({ companyId });
  const isOwner = roles.includes('company_owner');

  return (
    <>
      <h1>Company Details</h1>

      <ShowIf componentId="company.detail" action="edit">
        <button>Edit Company</button>
      </ShowIf>

      {isOwner && <AdminPanel />}
    </>
  );
}
```

### In a MFE

```tsx
function ApplicationsMFE({ companyId }) {
  const { getApplicationsInCompany, getRoles } = useHierarchicalPermissions();

  const apps = getApplicationsInCompany(companyId);
  const canCreate = getRoles({ companyId }).includes('company_owner');

  return (
    <>
      {apps.map(app => <AppCard key={app.id} {...app} />)}
      {canCreate && <button>Create Application</button>}
    </>
  );
}
```

---

## 📁 Project Organization

```
src/permissions/
├── Core Library
│   ├── types.ts                  # Type definitions
│   ├── index.ts                  # Permissions class
│   ├── react.tsx                 # React integration
│   └── config.ts                 # Configuration
│
├── Hierarchical System
│   ├── affiliations.ts           # User structure types
│   ├── hierarchical.ts           # Dynamic evaluator
│   └── useHierarchicalPermissions.ts # React hook
│
├── Documentation
│   ├── README.md                 # Entry point
│   ├── USAGE.md                  ⭐ Basic API reference
│   ├── HIERARCHICAL.md           ⭐ Hierarchy system
│   ├── MFE-INTEGRATION.md        ⭐⭐ START HERE
│   ├── API-INTEGRATION.md        ⭐ Server connection
│   └── TESTING.md                ⭐ Test patterns
│
├── Examples
│   ├── shell-example.tsx         # Shell setup
│   ├── mfe-examples.tsx          # 4 MFE patterns
│   └── hierarchicalExample.tsx   # Hierarchy demo
│
└── Tests
    ├── permissions.test.ts       (17 tests)
    └── affiliations.test.ts      (18 tests)
```

---

## 🧪 Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test permissions
```

**Status:** ✅ All 35 tests passing

---

## 🏗️ Building

```bash
# Build for production
pnpm build

# Build output
dist/index.es.js   (35.55 kB, gzipped: 9.49 kB)
dist/index.umd.js  (23.15 kB, gzipped: 7.97 kB)
dist/index.d.ts    (TypeScript declarations)
```

---

## 📚 Documentation Map

| Guide | Purpose | Read Time |
|-------|---------|-----------|
| **MFE-INTEGRATION.md** | Shell + MFE architecture | 15 min |
| **API-INTEGRATION.md** | Server connection + auth | 25 min |
| **USAGE.md** | API reference | 20 min |
| **HIERARCHICAL.md** | Role resolution | 20 min |
| **TESTING.md** | Test patterns | 20 min |
| **ARCHITECTURE.md** | Data models | 10 min |

---

## 🎓 Common Scenarios

### Scenario 1: Show component only to admin

```tsx
<ShowIf componentId="admin.panel" action="view">
  <AdminPanel />
</ShowIf>
```

### Scenario 2: Disable button for non-owners

```tsx
const { getRoles } = useHierarchicalPermissions();
const isOwner = getRoles({ companyId }).includes('company_owner');

<button disabled={!isOwner}>Edit Company</button>
```

### Scenario 3: Redirect if no access

```tsx
const { canAccessCompany } = useHierarchicalPermissions();

if (!canAccessCompany(companyId)) {
  return <Navigate to="/unauthorized" />;
}
```

### Scenario 4: Handle role changes across context

```tsx
const { getRoles } = useHierarchicalPermissions();

useEffect(() => {
  const roles = getRoles({ companyId, applicationId });
  updateUI(roles);
}, [companyId, applicationId]);
```

---

## ❓ FAQ

**Q: How do I add a new permission?**  
A: Update the `defaultPermissionConfig` in `config.ts` following the existing pattern.

**Q: How do I validate permissions on the server?**  
A: See the middleware example in [API-INTEGRATION.md](src/permissions/API-INTEGRATION.md).

**Q: Can I use this without hierarchies?**  
A: Yes! Use `usePermissions()` instead of `useHierarchicalPermissions()`.

**Q: Does this work with other state management?**  
A: Yes! The library is framework-agnostic. See integration examples in docs.

---

## 🔄 Next Steps

1. **Choose your scenario** from the guides above
2. **Read the relevant documentation** (15-25 minutes)
3. **Copy example code** from the integration docs
4. **Adapt to your use case** (forms, names, endpoints, etc.)
5. **Test** using the patterns from TESTING.md

---

## 💡 Pro Tips

- Use `<ShowIf>` for simple visibility toggles (cleaner JSX)
- Use `getRoles()` + conditionals for complex business logic
- Always validate permissions on the **server side** too
- Cache user data to reduce API calls
- Use WebSocket for real-time permission updates

---

## 🆘 Need Help?

1. **For Shell + MFE setup:** [MFE-INTEGRATION.md](src/permissions/MFE-INTEGRATION.md)
2. **For API connection:** [API-INTEGRATION.md](src/permissions/API-INTEGRATION.md)
3. **For testing:** [TESTING.md](src/permissions/TESTING.md)
4. **For API reference:** [USAGE.md](src/permissions/USAGE.md)

---

## ✨ You're All Set!

Everything is ready to integrate into your application. Start with [MFE-INTEGRATION.md](src/permissions/MFE-INTEGRATION.md) for the fastest path to a working integration.

**Happy coding! 🚀**
