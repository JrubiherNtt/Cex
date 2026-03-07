# Permission System - Guía de Uso

Una librería flexible de gestión de permisos (RBAC/ABAC) para React + Vite.

## 🚀 Quick Start

### 1. Configuración en tu App

```tsx
import React from 'react';
import { PermissionsProvider } from './permissions/react';
import { defaultPermissionConfig } from './permissions/config';

function App() {
  const currentUser = {
    id: 'user-123',
    name: 'John Doe',
    roles: ['company_owner', 'app_member'],
  };

  return (
    <PermissionsProvider config={defaultPermissionConfig} user={currentUser}>
      <YourAppComponents />
    </PermissionsProvider>
  );
}
```

### 2. Usar el Hook para verificar permisos

```tsx
import { usePermissions } from './permissions/react';

function CompanyDetail() {
  const { visible, canAction } = usePermissions();

  // Verificar si el componente es visible para el usuario
  if (!visible('company.detail')) {
    return <p>No tienes acceso.</p>;
  }

  // Verificar si puede realizar una acción específica
  const canEdit = canAction('company.detail', 'edit_instances');

  return (
    <div>
      <h1>Detalles de Empresa</h1>
      <button disabled={!canEdit}>
        Editar Instancias
      </button>
    </div>
  );
}
```

### 3. Usar el componente `<ShowIf>`

```tsx
import { ShowIf } from './permissions/react';

function Navigation() {
  return (
    <nav>
      <ShowIf componentId="company.detail" action="edit_owners">
        <button>Cambiar Propietarios</button>
      </ShowIf>

      <ShowIf componentId="applications.list" action="create">
        <button>+ Nueva Aplicación</button>
      </ShowIf>

      <ShowIf componentId="company.detail" action="show_banner">
        <div className="banner">
          Información importante
        </div>
      </ShowIf>
    </nav>
  );
}
```

## 📚 API Reference

### `usePermissions()`

Hook que devuelve métodos para verificar permisos del usuario actual.

#### Retorna:

```typescript
{
  can(action: string, resource: string | object, context?: object) => boolean
  visible(componentId: string, context?: object) => boolean
  canAction(componentId: string, action: string, context?: object) => boolean
  user: Attributes  // El usuario actual
}
```

#### Ejemplos:

```tsx
const { can, visible, canAction, user } = usePermissions();

// Verificar si un componente es visible
if (visible('company.list')) { … }

// Verificar si puede realizar una acción
if (canAction('company.detail', 'edit_instances')) { … }

// Método genérico (para evaluaciones personalizadas)
if (can('delete', 'user-123')) { … }

// Acceso al usuario actual
console.log(user.roles); // ['admin', 'company_owner']
```

### `<ShowIf />`

Componente de render condicional basado en permisos.

#### Props:

- `componentId?: string` — Path del componente (ej: `"company.detail"`)
- `action?: string` — Acción a verificar (ej: `"edit_instances"`)
- `resource?: string | object` — Recurso (alternativa a `componentId`)
- `context?: object` — Contexto adicional para evaluación dinámica
- `children: ReactNode` — Contenido a mostrar si tiene permiso
- `fallback?: ReactNode` — Contenido alternativo si NO tiene permiso

#### Ejemplos:

```tsx
{/* Verificar componente + acción */}
<ShowIf componentId="company.detail" action="edit_owners">
  <button>Edit Owners</button>
</ShowIf>

{/* Mostrar solo si componente es visible */}
<ShowIf componentId="applications.list">
  <ApplicationsList />
</ShowIf>

{/* Con fallback */}
<ShowIf
  componentId="company.detail"
  action="edit_instances"
  fallback={<p>No tienes permisos para editar.</p>}
>
  <EditForm />
</ShowIf>
```

### `PermissionsProvider`

Proveedor que inyecta permisos en toda la app.

#### Props:

- `config: PermissionConfig` — Configuración de roles y permisos
- `user: Attributes` — Usuario actual (con campo `roles: string[]`)
- `evaluator?: (policy, user, resource, context) => boolean` — Evaluador personalizado
- `children: ReactNode` — Componentes hijos

## 🏗️ Estructura de Permisos

La librería usa una estructura jerárquica similar a tu `permisos.jsonc`:

```typescript
{
  layouts: {
    company: {
      list: {
        show: ['admin', 'company_owner', 'anonymous'],
        actions: {
          create: ['admin'],
        },
      },
      detail: {
        show: ['admin', 'company_owner', 'company_member'],
        actions: {
          edit_instances: ['admin', 'company_owner'],
          edit_owners: ['admin'],
        },
      },
      team: {
        list: {
          show: ['admin', 'company_owner', 'team_owner'],
          actions: {
            create: ['admin', 'company_owner'],
          },
        },
        // ...
      },
    },
    applications: {
      // ...
    },
  },
}
```

### Cómo funciona:

- **`show`** — Lista de roles que pueden ver ese componente
- **`actions`** — Acciones disponibles y qué roles pueden realizarlas

### Path de acceso:

Se usan puntos para navegar la jerarquía:

- `"company.list"` → Componente lista de empresas
- `"company.detail"` → Detalle de empresa
- `"company.team.members_list"` → Miembros del equipo de empresa
- `"applications.detail"` → Detalle de aplicación

## 🎯 Casos de Uso Comunes

### 1. Mostrar/Ocultar un botón según rol

```tsx
<ShowIf componentId="company.detail" action="edit_owners">
  <button onClick={handleEditOwners}>
    Cambiar Propietarios
  </button>
</ShowIf>
```

### 2. Validar antes de enviar un formulario

```tsx
function EditCompanyForm() {
  const { canAction } = usePermissions();
  const [formData, setFormData] = useState({});

  const handleSubmit = () => {
    if (!canAction('company.detail', 'edit_instances')) {
      alert('No tienes permisos para hacer esto');
      return;
    }
    // Enviar datos...
  };

  return <form onSubmit={handleSubmit}>…</form>;
}
```

### 3. Renderizar diferentes layouts según rol

```tsx
function Dashboard() {
  const { user, visible } = usePermissions();
  const isAdmin = user.roles.includes('admin');
  const canViewApps = visible('applications.list');

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {canViewApps && <ApplicationsList />}
    </div>
  );
}
```

### 4. Proteger rutas (con React Router)

```tsx
function ProtectedRoute({ componentId, action, children }) {
  const { canAction, visible } = usePermissions();

  const hasAccess = action
    ? canAction(componentId, action)
    : visible(componentId);

  return hasAccess ? children : <Navigate to="/forbidden" />;
}

// Uso:
<ProtectedRoute componentId="company.detail" action="edit_instances">
  <EditCompanyPage />
</ProtectedRoute>
```

## 🧪 Testing

Usa la clase `Permissions` directamente en tests:

```typescript
import { Permissions } from './permissions/index';
import { defaultPermissionConfig } from './permissions/config';

test('admin can edit company instances', () => {
  const perms = new Permissions({ config: defaultPermissionConfig });
  const admin = { roles: ['admin'] };

  expect(perms.canAction(admin, 'company.detail', 'edit_instances')).toBe(true);
});

test('app member cannot edit company owners', () => {
  const perms = new Permissions({ config: defaultPermissionConfig });
  const appMember = { roles: ['app_member'] };

  expect(perms.canAction(appMember, 'company.detail', 'edit_owners')).toBe(false);
});
```

## 🔧 Personalización

### Agregar nuevas acciones

Edita `src/permissions/config.ts` y añade la acción en la estructura:

```typescript
export const defaultPermissionConfig = {
  layouts: {
    company: {
      detail: {
        actions: {
          // Acción nueva
          export_data: ['admin', 'company_owner'],
        },
      },
    },
  },
};
```

Luego úsala:

```tsx
<ShowIf componentId="company.detail" action="export_data">
  <button>Exportar Datos</button>
</ShowIf>
```

### Evaluador personalizado (ABAC)

Para permisos más complejos, proporciona un evaluador personalizado:

```tsx
const customEvaluator = (policy, user, resource, context) => {
  // Lógica personalizada: ej. verificar que el usuario sea propietario del recurso
  if (policy.action === 'edit' && context?.ownerId === user.id) {
    return true;
  }
  return false;
};

<PermissionsProvider
  config={defaultPermissionConfig}
  user={currentUser}
  evaluator={customEvaluator}
>
  <App />
</PermissionsProvider>
```

## 📝 Notas

- Los permisos se evalúan en **tiempo de renderizado**.
- Los datos de usuario que cambien deben actualizarse pasando un nuevo `user` al Provider.
- El sistema es agnóstico del backend; valida en cliente pero debes **validar siempre en servidor**.

## 🚀 Próximas mejoras

- [ ] Cache de evaluaciones
- [ ] Soporte para permisos dinámicos desde API
- [ ] Integración con estado global (Zustand, Redux)
- [ ] CLI para generar tipos desde JSON
