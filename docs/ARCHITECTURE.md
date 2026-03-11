# Application Architecture

## Shell Overview

The application is built with multiple micro-frontends (MFEs) organized hierarchically.

```
shell
├── companies (MFE)
│   ├── list
│   ├── detail
│   └── teams
└── applications (MFE)
    ├── list
    ├── detail
    ├── teams
    └── components (MFE)
```

## User Data Structure

### `getSelfInfo()`
Returns basic user information and global roles.

```json
{
  "name": "John",
  "email": "john@email.com",
  "roles": ["admin", "user", "anonymous"]
}
```

### `getAfiliations()`
Returns user affiliations with nested companies and applications, including contextual roles.

```json
{
  "companies": [
    {
      "id": 1,
      "name": "company_1",
      "roles": ["company_owner", "company_member"],
      "applications": [
        {
          "id": 1,
          "name": "application_1",
          "roles": ["app_owner", "app_member"]
        }
      ]
    }
  ]
}
```

## Role Hierarchy

Roles are organized at multiple levels:

1. **Global Roles** — `admin`, `user`, `anonymous`
2. **Company-level Roles** — `company_owner`, `company_member`
3. **Application-level Roles** — `app_owner`, `app_member`
4. **Team-level Roles** — `team_owner`, `team_member` (inferred from context)

## Permission Model

Permissions are evaluated based on:
- User's global role
- User's role within a specific company
- User's role within a specific application
- Contextual resource being accessed (company, application, team)
