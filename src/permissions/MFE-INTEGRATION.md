# Shell & MFE Integration Guide

Esta guía muestra cómo integrar el sistema de permisos en una arquitectura de Shell + Micro-frontends.

## Arquitectura General

```
┌─────────────────────────────────────────────────┐
│                   SHELL                         │
│  • Obtiene usuario + afiliaciones              │
│  • Proporciona PermissionsProvider             │
│  • Maneja contexto global (empresa, app)      │
│  • Comunica cambios de contexto a MFEs        │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│         MFE CONTAINER (módulo federado)         │
│  • Recibe contexto del Shell                   │
│  • Obtiene permisos vía useHierarchicalPerms   │
│  • Renderiza UI según permisos                 │
└─────────────────────────────────────────────────┘
     ↙          ↓          ↓          ↘
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│Companies│  │ Apps   │  │Dashboard│  │Teams  │
│  MFE   │  │  MFE   │  │  MFE   │  │ MFE   │
└────────┘  └────────┘  └────────┘  └────────┘
```

## 1. SHELL: Configuración Principal

### 1.1 Árbol de Componentes

```typescript
<ShellApp>
  <PermissionsProvider user={user} config={config}>
    <Header />
    <Navigation />  // Selector de empresa/app
    <MFEContainer>  // Carga dinámicamente MFEs
```

### 1.2 Flujo de Datos

```typescript
// shell-app.tsx

function ShellApp() {
  // 1. Obtener usuario del API
  const [user, setUser] = useState<UserWithAffiliations>(null);

  useEffect(() => {
    const userData = await fetchUserData(); // API call
    setUser(userData);
  }, []);

  // 2. Proporcionar PermissionsProvider
  return (
    <PermissionsProvider
      config={defaultPermissionConfig}
      user={user}
      evaluator={createAffiliationEvaluator()}
    >
      <Navigation />         // Selector empresa/app
      <MFEContainer />      // Renderiza MFEs
    </PermissionsProvider>
  );
}
```

### 1.3 Comunicación Shell → MFEs

**Opción 1: URL Params (Recomendado)**

```typescript
// Shell actualiza la URL cuando cambia contexto
function Navigation() {
  const handleCompanyChange = (companyId: string) => {
    // Navegar con el nuevo contexto
    navigate(`/shell?company=${companyId}`);
  };
}

// MFE lee el contexto de URL
function MFEContainer() {
  const { company, app } = useSearchParams();
  return <ApplicationsMFE companyId={company} applicationId={app} />;
}
```

**Opción 2: React Context (para estado compartido)**

```typescript
// crear un contexto de Shell
const ShellContextContext = createContext<{
  companyId?: string;
  applicationId?: string;
  onContextChange?: (ctx: PermissionContext) => void;
}>(null);

// En Shell
<ShellContext.Provider value={{ companyId, applicationId, onContextChange }}>
  <MFEContainer />
</ShellContext.Provider>

// En MFE
const { companyId, applicationId } = useContext(ShellContext);
```

**Opción 3: Event Bus (para micro-frontends desacoplados)**

```typescript
// event-bus.ts
class EventBus {
  static on(event: string, handler: Function) { /* ... */ }
  static emit(event: string, data: any) { /* ... */ }
}

// En Shell
EventBus.emit('context-changed', { companyId, applicationId });

// En MFE
useEffect(() => {
  EventBus.on('context-changed', (ctx) => {
    setContext(ctx);
  });
}, []);
```

## 2. MFEs: Uso de Permisos

### 2.1 Patrón Básico en MFE

```typescript
// mfe-companies.tsx

export function CompaniesMFE() {
  // 1. Acceder a permisos
  const {
    getCompanies,
    getRoles,
    canAccessCompany,
  } = useHierarchicalPermissions();

  // 2. Obtener datos según permisos
  const companies = getCompanies().filter(
    (c) => canAccessCompany(c.id)
  );

  // 3. Renderizar UI condicional
  return (
    <>
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </>
  );
}
```

### 2.2 Validación en MFE

```typescript
// Dentro de un MFE
function EditCompanyForm({ companyId }: { companyId: string }) {
  const { canAction, getRoles } = useHierarchicalPermissions();

  const context = { companyId };
  const rolesInCompany = getRoles(context);

  // Validar antes de renderizar
  if (!rolesInCompany.includes('company_owner')) {
    return <p>No tienes permisos para editar esta empresa</p>;
  }

  return (
    <form>
      <input type="text" placeholder="Nombre" />
      <button type="submit">Guardar</button>
    </form>
  );
}
```

### 2.3 Patrones de Renderizado

#### Usar `<ShowIf>` para UI condicional

```typescript
<ShowIf
  componentId="company.detail"
  action="edit_instances"
>
  <button>Editar Instancias</button>
</ShowIf>
```

#### Usar `canAction()` para validar manualmente

```typescript
const { canAction } = useHierarchicalPermissions();
const isAllowed = canAction('company.detail', 'edit_owners');
<button disabled={!isAllowed}>Gestionar Propietarios</button>
```

#### Usar `getRoles()` para lógica compleja

```typescript
const { getRoles } = useHierarchicalPermissions();
const roles = getRoles({ companyId });

if (roles.includes('company_owner')) {
  return <AdminPanel />;
} else if (roles.includes('company_member')) {
  return <MemberView />;
} else {
  return <GuestView />;
}
```

## 3. Casos de Uso Completos

### Caso 1: Cambiar de Empresa

```typescript
// En Shell Navigation
function CompanySelector() {
  const { getCompanies } = useHierarchicalPermissions();

  const handleCompanyChange = (companyId: string) => {
    // 1. Actualizar URL o estado
    navigate(`?company=${companyId}`);

    // 2. Emitir evento para MFEs
    EventBus.emit('company-changed', companyId);

    // 3. Reset de aplicación seleccionada
    navigate(`?company=${companyId}&app=`);
  };

  return (
    <select onChange={(e) => handleCompanyChange(e.target.value)}>
      {getCompanies().map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
```

### Caso 2: Validación al Acceder a Aplicación

```typescript
// En MFE ApplicationDetail
function ApplicationDetailMFE({
  companyId,
  applicationId,
}: Props) {
  const { getRoles, canAccessApplication } = useHierarchicalPermissions();

  // 1. Verificar acceso
  if (!canAccessApplication(applicationId)) {
    return <AccessDenied />;
  }

  // 2. Obtener roles en este contexto
  const rolesInApp = getRoles({
    companyId,
    applicationId,
  });

  // 3. Renderizar según roles
  return (
    <>
      {rolesInApp.includes('app_owner') && <AdminSection />}
      {rolesInApp.includes('app_member') && <MemberSection />}
    </>
  );
}
```

### Caso 3: Crear Nuevo Recurso

```typescript
// En cualquier MFE
function CreateApplicationForm({ companyId }: Props) {
  const { canAction, getRoles } = useHierarchicalPermissions();

  const canCreate = canAction('applications.list', 'create');
  const context = { companyId };

  if (!canCreate) {
    return <p>No tienes permisos para crear aplicaciones</p>;
  }

  const handleSubmit = async (formData) => {
    // 1. Validar permisos nuevamente (defensa en profundidad)
    const rolesInCompany = getRoles(context);
    if (!['company_owner', 'admin'].includes(rolesInCompany[0])) {
      alert('Acceso denegado');
      return;
    }

    // 2. Enviar al API
    await createApplication(formData);

    // 3. Actualizar UI
    EventBus.emit('application-created', { companyId });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## 4. Seguridad: Validación en Servidor

⚠️ **Importante:** Siempre validar en servidor

```typescript
// API endpoint
POST /api/companies/:companyId/edit
{
  // 1. Extraer token y obtener usuario
  const user = await getUserFromToken(req.headers.authorization);

  // 2. Validar que usuario tiene acceso a esta compañía
  const hasAccess = user.companies.some(c => c.id === companyId);
  if (!hasAccess) return 403 Forbidden;

  // 3. Validar que tiene rol apropiado
  const company = user.companies.find(c => c.id === companyId);
  if (!company.roles.includes('company_owner')) {
    return 403 Forbidden;
  }

  // 4. Proceder con la operación
  await updateCompany(companyId, req.body);
}
```

## 5. Integración con Herramientas

### Module Federation (Webpack 5 / Next.js)

```javascript
// mfe-companies/next.config.js
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new ModuleFederationPlugin({
        name: 'companies_mfe',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './CompaniesMFE': './src/permissions/mfe-examples.tsx',
        },
        shared: {
          react: { singleton: true },
          '@cex/permissions': { singleton: true },
        },
      })
    );
    return config;
  },
};
```

### Single SPA

```typescript
// registerApplication
singleSpa.registerApplication({
  name: '@app/companies',
  app: () => System.import('@app/companies'),
  activeWhen: '/companies',
  customProps: {
    companyId: (location) => getCompanyIdFromUrl(location),
    applicationId: (location) => getAppIdFromUrl(location),
  },
});

// En MFE
export async function bootstrap(props: any) {
  const { companyId, applicationId } = props;
  // Usar en componentes
}
```

## 6. Checklist de Implementación

- [ ] Shell obtiene usuario y proporciona `PermissionsProvider`
- [ ] Shell maneja selector empresa/app
- [ ] Shell comunica contexto a MFEs (URL/Context/EventBus)
- [ ] MFEs usan `useHierarchicalPermissions()` para acceso
- [ ] MFEs validan permisos antes de renderizar
- [ ] Se usa `<ShowIf>` o `canAction()` para UI condicional
- [ ] API valida permisos en servidor (defensa en profundidad)
- [ ] Tests unitarios para validación de permisos
- [ ] Manejo de cambio de contexto sin recargar
- [ ] Documentar permisos requeridos en cada MFE

## 7. Ejemplo Completo - Integración

Ver archivos:
- `shell-example.tsx` — Configuración del Shell
- `mfe-examples.tsx` — Diferentes MFEs
