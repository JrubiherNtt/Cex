# API Integration Guide

Esta guía muestra cómo integrar el sistema de permisos con APIs reales.

## 1. Obtención de Usuario y Afiliaciones

### 1.1 Llamada API Inicial (Shell)

```typescript
// api/user.ts

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  globalRoles: Role[];
  companies: CompanyAffiliation[];
}

export interface CompanyAffiliation {
  id: string;
  name: string;
  roles: Role[];
  applications: ApplicationAffiliation[];
}

export interface ApplicationAffiliation {
  id: string;
  name: string;
  roles: Role[];
  teams?: TeamAffiliation[];
}

export interface TeamAffiliation {
  id: string;
  name: string;
  roles: Role[];
}

export async function fetchUserData(): Promise<UserWithAffiliations> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch('/api/v1/me', {
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado, redirigir a login
      window.location.href = '/login';
    }
    throw new Error('Failed to fetch user');
  }

  const data: UserResponse = await response.json();

  // Convertir a UserWithAffiliations
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    globalRoles: data.globalRoles,
    companies: data.companies.map((c) => ({
      id: c.id,
      name: c.name,
      roles: c.roles,
      applications: c.applications.map((a) => ({
        id: a.id,
        name: a.name,
        roles: a.roles,
        teams: a.teams?.map((t) => ({
          id: t.id,
          name: t.name,
          roles: t.roles,
        })) || [],
      })),
    })),
  };
}
```

### 1.2 Token Management

```typescript
// api/auth.ts

export class TokenManager {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.startRefreshTimer();
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private static startRefreshTimer(): void {
    setInterval(() => {
      this.refreshToken();
    }, this.REFRESH_INTERVAL);
  }

  private static async refreshToken(): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${token}\`,
        },
      });

      if (response.ok) {
        const { token: newToken } = await response.json();
        this.setToken(newToken);
      } else {
        this.clearToken();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }
}
```

### 1.3 Error Handling

```typescript
// api/client.ts

export class ApiClient {
  static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = TokenManager.getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: \`Bearer \${token}\` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // No autorizado - redirigir a login
      TokenManager.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      // Prohibido - mostrar error de permisos
      throw new Error('Access Denied');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }
}
```

## 2. Validación en Servidor

### 2.1 Middleware de Autenticación

```typescript
// middleware/auth.ts (Express.js)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    globalRoles: string[];
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 2.2 Middleware de Permisos

```typescript
// middleware/permissions.ts

export type PermissionMatcher =
  | string // "company_owner"
  | string[] // ["company_owner", "admin"]
  | ((context: PermissionContext) => boolean); // Custom function

export function requirePermission(requiredRoles: PermissionMatcher) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Obtener afiliaciones del usuario
    const user = await getUserWithAffiliations(req.user.id);

    // Preparar contexto de permisos
    const context = {
      companyId: req.params.companyId,
      applicationId: req.params.applicationId,
      teamId: req.params.teamId,
    };

    // Verificar permisos
    const evaluator = createAffiliationEvaluator();
    const hasPermission = evaluator(user, requiredRoles, context);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    next();
  };
}
```

### 2.3 Rutas Protegidas

```typescript
// routes/companies.ts

import express from 'express';
import { authMiddleware, requirePermission } from '../middleware';

const router = express.Router();

// GET /companies - Solo usuarios autenticados
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const companies = await getCompaniesForUser(req.user!.id);
  res.json(companies);
});

// GET /companies/:companyId - Requiere acceso a la compañía
router.get(
  '/:companyId',
  authMiddleware,
  requirePermission('company_owner'),
  async (req: AuthRequest, res) => {
    const company = await getCompany(req.params.companyId);
    res.json(company);
  }
);

// POST /companies - Solo admins
router.post(
  '/',
  authMiddleware,
  requirePermission(['admin', 'super_admin']),
  async (req: AuthRequest, res) => {
    const company = await createCompany(req.body);
    res.json(company);
  }
);

// PUT /companies/:companyId - Propietarios o admins
router.put(
  '/:companyId',
  authMiddleware,
  requirePermission((context) => {
    const user = req.user as any; // Aquí estaría el user desde context
    return ['company_owner', 'admin'].includes(
      user.rolesInContext?.[context.companyId]?.[0] || ''
    );
  }),
  async (req: AuthRequest, res) => {
    const company = await updateCompany(req.params.companyId, req.body);
    res.json(company);
  }
);

export default router;
```

## 3. Caché de Permisos

### 3.1 Caché en Cliente

```typescript
// cache/userCache.ts

export class UserCache {
  private static cache = new Map<string, UserWithAffiliations>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static timestamps = new Map<string, number>();

  static isFresh(userId: string): boolean {
    const timestamp = this.timestamps.get(userId);
    if (!timestamp) return false;

    const now = Date.now();
    return now - timestamp < this.CACHE_DURATION;
  }

  static get(userId: string): UserWithAffiliations | null {
    if (!this.isFresh(userId)) {
      this.cache.delete(userId);
      return null;
    }
    return this.cache.get(userId) || null;
  }

  static set(userId: string, user: UserWithAffiliations): void {
    this.cache.set(userId, user);
    this.timestamps.set(userId, Date.now());
  }

  static invalidate(userId: string): void {
    this.cache.delete(userId);
    this.timestamps.delete(userId);
  }

  static clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// Uso en Shell
export async function fetchUserData(): Promise<UserWithAffiliations> {
  const userId = decodeToken().id;

  // Intentar obtener del caché
  const cached = UserCache.get(userId);
  if (cached) {
    console.log('Using cached user data');
    return cached;
  }

  // Si no está en caché, obtener del API
  const user = await ApiClient.request<UserWithAffiliations>(
    '/api/v1/me'
  );

  // Guardar en caché
  UserCache.set(userId, user);

  return user;
}
```

### 3.2 Invalidación de Caché

```typescript
// En MFE después de crear/actualizar
async function handleCreateApplication(data: any) {
  const response = await ApiClient.request('/api/v1/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.ok) {
    // Invalidar caché de usuario
    const userId = decodeToken().id;
    UserCache.invalidate(userId);

    // Emitir evento para refrescar
    EventBus.emit('user-permissions-changed', { userId });
  }
}
```

## 4. Refrescado de Permisos en Tiempo Real

### 4.1 WebSocket para Updates

```typescript
// websocket/permissionClient.ts

export class PermissionWebSocket {
  private socket: WebSocket | null = null;

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(
        \`\${WEBSOCKET_URL}?user=\${userId}&token=\${token}\`
      );

      this.socket.onopen = () => {
        console.log('Connected to permission updates');
        resolve();
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'permission-changed':
        // Ejemplo: Se cambió el rol del usuario en una aplicación
        EventBus.emit('permission-changed', {
          companyId: message.companyId,
          applicationId: message.applicationId,
          roles: message.roles,
        });
        // Invalidar caché
        UserCache.invalidate(message.userId);
        break;

      case 'user-updated':
        // El usuario fue actualizado en otro dispositivo
        EventBus.emit('user-updated', { userId: message.userId });
        UserCache.invalidate(message.userId);
        break;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Usar en Shell
function ShellApp() {
  const wsClient = useRef(new PermissionWebSocket());

  useEffect(() => {
    const token = TokenManager.getToken();
    const userId = decodeToken().id;

    wsClient.current
      .connect(userId, token!)
      .catch((error) => console.error('WebSocket failed:', error));

    return () => {
      wsClient.current.disconnect();
    };
  }, []);
}
```

## 5. Patrones de Error y Retry

### 5.1 Retry con Backoff Exponencial

```typescript
// api/retry.ts

export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // No reintentar en 401/403/404
      if (
        error instanceof Error &&
        ['Unauthorized', 'Access Denied', 'Not Found'].some((msg) =>
          error.message.includes(msg)
        )
      ) {
        throw error;
      }

      // Si es el último intento, lanzar error
      if (i === maxRetries - 1) {
        throw error;
      }

      // Esperar con backoff exponencial
      const delay = initialDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Uso
const user = await retryRequest(() => fetchUserData(), 3, 1000);
```

### 5.2 Error Boundaries

```typescript
// components/ErrorBoundary.tsx

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Permission error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) || (
          <div>
            <h2>Permission Error</h2>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Uso
<ErrorBoundary fallback={(error) => <AccessDenied error={error} />}>
  <MFEContainer />
</ErrorBoundary>
```

## 6. Testing APIs

### 6.1 Mock de Servidor

```typescript
// __mocks__/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/v1/me', () => {
    return HttpResponse.json({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      globalRoles: ['user'],
      companies: [
        {
          id: 'company-1',
          name: 'Company 1',
          roles: ['company_owner'],
          applications: [],
        },
      ],
    });
  }),

  http.post('/api/v1/applications', ({ request }) => {
    // Verificar headers
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json(
      { id: 'app-1', name: 'New App' },
      { status: 201 }
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 6.2 Test de Integración

```typescript
// __tests__/api.test.ts
import { fetchUserData } from '../api/user';
import { server } from '../__mocks__/server';

describe('API Integration', () => {
  it('should fetch user data with permissions', async () => {
    const user = await fetchUserData();

    expect(user.id).toBe('1');
    expect(user.companies).toHaveLength(1);
    expect(user.companies[0].roles).toContain('company_owner');
  });

  it('should handle 401 errors', async () => {
    server.use(
      http.get('/api/v1/me', () => {
        return HttpResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      })
    );

    await expect(fetchUserData()).rejects.toThrow();
  });
});
```

## Checklist de Integración API

- [ ] Endpoint `/api/v1/me` devuelve `UserWithAffiliations`
- [ ] Token se obtiene y se almacena en localStorage
- [ ] Token se refresca automáticamente
- [ ] Middleware de autenticación valida token
- [ ] Middleware de permisos valida contexto
- [ ] Cache de usuario implementado
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Retry con backoff exponencial
- [ ] Error boundaries en componentes React
- [ ] Tests de integración con MSW
- [ ] Documentación de endpoints en Swagger/OpenAPI
