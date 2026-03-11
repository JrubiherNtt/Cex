/**
 * SHELL APPLICATION
 * 
 * El shell es responsable de:
 * 1. Obtener información del usuario
 * 2. Obtener afiliaciones del usuario
 * 3. Proporcionar contexto de permisos a toda la app
 * 4. Manejar cambios de contexto (cambiar compañía, aplicación)
 */

import React, { useState, useEffect } from 'react';
import { PermissionsProvider } from '@cex/permissions';
import { useHierarchicalPermissions } from '@cex/permissions';
import {
  UserWithAffiliations,
  PermissionContext,
  createContext,
} from '@cex/permissions';
import {
  createAffiliationEvaluator,
} from '@cex/permissions';
import { defaultPermissionConfig } from '@cex/permissio../core/config';

// Mock de API
async function fetchUserInfo(): Promise<UserWithAffiliations> {
  // En producción, llamar a tu API
  return {
    id: 'user-123',
    name: 'Juan García',
    email: 'juan@example.com',
    globalRoles: ['user'],
    companies: [
      {
        id: 'company-1',
        name: 'Acme Corp',
        roles: ['company_owner'],
        applications: [
          {
            id: 'app-1',
            name: 'Dashboard Pro',
            roles: ['app_owner'],
            teams: [
              {
                id: 'team-1',
                name: 'Frontend Team',
                roles: ['team_owner'],
              },
            ],
          },
          {
            id: 'app-2',
            name: 'Analytics Hub',
            roles: ['app_member'],
          },
        ],
      },
      {
        id: 'company-2',
        name: 'TechStart Inc',
        roles: ['company_member'],
        applications: [
          {
            id: 'app-3',
            name: 'Project Manager',
            roles: ['app_member'],
          },
        ],
      },
    ],
  };
}

/**
 * Navigation Shell Component
 * Maneja la navegación entre empresas y aplicaciones
 */
function ShellNavigation() {
  const {
    getCompanies,
    getApplicationsInCompany,
  } = useHierarchicalPermissions();

  const [selectedCompany, setSelectedCompany] = useState<string | null>(
    getCompanies()[0]?.id || null
  );
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const companies = getCompanies();
  const apps = selectedCompany
    ? getApplicationsInCompany(selectedCompany)
    : [];

  // Cuando cambia la compañía, resetear app
  useEffect(() => {
    setSelectedApp(apps[0]?.id || null);
  }, [selectedCompany, apps]);

  return (
    <nav
      style={{
        padding: '1rem',
        backgroundColor: '#2c3e50',
        color: 'white',
        marginBottom: '1rem',
      }}
    >
      <h2 style={{ margin: '0 0 1rem 0' }}>Selector de Contexto</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <strong>Empresa:</strong>
        </label>
        <select
          value={selectedCompany || ''}
          onChange={(e) => setSelectedCompany(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minWidth: '200px',
          }}
        >
          <option value="">Selecciona una empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.roles.join(', ')})
            </option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <strong>Aplicación:</strong>
          </label>
          <select
            value={selectedApp || ''}
            onChange={(e) => setSelectedApp(e.target.value)}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              minWidth: '200px',
            }}
          >
            <option value="">Selecciona una aplicación</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.roles.join(', ')})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mostrar contexto actual */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
        }}
      >
        <p>
          <strong>Contexto actual:</strong>
        </p>
        <pre style={{ color: '#81c784', fontSize: '12px' }}>
          {JSON.stringify(
            {
              companyId: selectedCompany,
              applicationId: selectedApp,
            },
            null,
            2
          )}
        </pre>
      </div>
    </nav>
  );
}

/**
 * Context Provider Shell
 * Proporciona permisos a toda la app
 */
function ShellApp() {
  const [user, setUser] = useState<UserWithAffiliations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo().then((userData) => {
      setUser(userData);
      setLoading(false);
    });
  }, []);

  if (loading || !user) {
    return <div>Cargando permisos...</div>;
  }

  const evaluator = createAffiliationEvaluator();

  return (
    <PermissionsProvider
      config={defaultPermissionConfig}
      user={user}
      evaluator={evaluator}
    >
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* Header */}
        <header style={{ padding: '1rem', backgroundColor: '#34495e', color: 'white' }}>
          <h1 style={{ margin: 0 }}>
            🏢 {user.name}
          </h1>
        </header>

        {/* Navigation Shell */}
        <ShellNavigation />

        {/* Micro-frontends Container */}
        <div
          id="mfe-container"
          style={{
            padding: '1rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Los MFEs se cargarían aquí */}
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h2>Contenedor de Aplicaciones (MFE)</h2>
            <p>
              Los MFEs reciben contexto de permisos vía event bus o context
              API
            </p>
          </div>
        </div>
      </div>
    </PermissionsProvider>
  );
}

export default ShellApp;
