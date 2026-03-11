/**
 * MFE EXAMPLES
 *
 * Cada MFE (Micro-Frontend) recibe:
 * 1. Contexto de permisos (companyId, applicationId, teamId)
 * 2. Usuario con afiliaciones
 * 3. Hook para acceder a permisos locales
 */

import React from 'react';
import { useHierarchicalPermissions, ShowIf } from '@cex/permissions';
import { PermissionContext } from '@cex/permissions';

/**
 * EXAMPLES DE MFE: COMPANIES
 * Aplicación para listar y gestionar empresas
 */
export function CompaniesListMFE() {
  const { getCompanies, getRoles } = useHierarchicalPermissions();

  const companies = getCompanies();

  return (
    <div style={{ border: '2px solid #3498db', padding: '1rem', borderRadius: '8px' }}>
      <h2>📊 Empresas (MFE)</h2>

      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ecf0f1' }}>
        <p>
          <strong>Mis roles globales:</strong> {getRoles().join(', ')}
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Empresa</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Mis Roles</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} style={{ borderBottom: '1px solid #bdc3c7' }}>
              <td style={{ padding: '0.5rem' }}>
                <strong>{company.name}</strong>
              </td>
              <td style={{ padding: '0.5rem' }}>{company.roles.join(', ')}</td>
              <td style={{ padding: '0.5rem' }}>
                {/* Solo mostrar botón de edición si es owner */}
                <ShowIf
                  action="edit"
                  resource={company.id}
                  fallback={<span style={{ color: '#7f8c8d' }}>Ver</span>}
                >
                  <button
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                </ShowIf>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * MFE: APPLICATIONS
 * Mostrar aplicaciones dentro de una empresa
 */
interface ApplicationsMFEProps {
  companyId: string;
}

export function ApplicationsMFE({ companyId }: ApplicationsMFEProps) {
  const { getApplicationsInCompany, getRoles } = useHierarchicalPermissions();

  const context: PermissionContext = { companyId };
  const rolesInCompany = getRoles(context);
  const apps = getApplicationsInCompany(companyId);

  if (!apps.length) {
    return <p>No tienes acceso a aplicaciones en esta empresa.</p>;
  }

  return (
    <div style={{ border: '2px solid #2ecc71', padding: '1rem', borderRadius: '8px' }}>
      <h3>🚀 Aplicaciones</h3>

      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ecf0f1' }}>
        <p>
          <strong>Roles en esta empresa:</strong> {rolesInCompany.join(', ')}
        </p>
      </div>

      {/* Botón crear nueva app (solo para owners) */}
      <ShowIf action="create" resource="application" fallback={null}>
        <button
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Nueva Aplicación
        </button>
      </ShowIf>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {apps.map((app) => (
          <div
            key={app.id}
            style={{
              padding: '1rem',
              backgroundColor: '#ecf0f1',
              borderRadius: '4px',
              border: '1px solid #bdc3c7',
            }}
          >
            <h4>{app.name}</h4>
            <p style={{ fontSize: '12px', color: '#7f8c8d' }}>Roles: {app.roles.join(', ')}</p>
            <div style={{ marginTop: '0.5rem' }}>
              <button style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}>Abrir</button>
              <ShowIf action="edit" resource={app.id} fallback={null}>
                <button style={{ padding: '0.25rem 0.5rem' }}>Editar</button>
              </ShowIf>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MFE: DASHBOARD DETAIL
 * Detalle de una aplicación con acceso a componentes
 */
interface ApplicationDetailMFEProps {
  companyId: string;
  applicationId: string;
}

export function ApplicationDetailMFE({ companyId, applicationId }: ApplicationDetailMFEProps) {
  const { getRoles, canAction } = useHierarchicalPermissions();

  const context: PermissionContext = {
    companyId,
    applicationId,
  };

  const rolesInApp = getRoles(context);
  const canEdit = canAction('applications.detail', 'edit_instances');
  const canManageTeam = canAction('applications.detail', 'edit_owners');

  return (
    <div style={{ border: '2px solid #9b59b6', padding: '1rem', borderRadius: '8px' }}>
      <h3>📈 Detalle de Aplicación</h3>

      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ecf0f1' }}>
        <p>
          <strong>Roles en esta aplicación:</strong> {rolesInApp.join(', ')}
        </p>
      </div>

      {/* Sección de configuración - visible solo para propietarios */}
      <ShowIf componentId="applications.detail" action="edit_instances">
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <h4>⚙️ Configuración (Solo Propietarios)</h4>
          <button
            disabled={!canEdit}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: canEdit ? '#e74c3c' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canEdit ? 'pointer' : 'not-allowed',
            }}
          >
            Editar Instancias
          </button>
        </div>
      </ShowIf>

      {/* Sección de Admin - solo admin global */}
      <ShowIf componentId="applications.detail" action="edit_owners">
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <h4>🔐 Gestión de Propietarios (Solo Admin)</h4>
          <button
            disabled={!canManageTeam}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: canManageTeam ? '#dc3545' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: canManageTeam ? 'pointer' : 'not-allowed',
            }}
          >
            Gestionar Propietarios
          </button>
        </div>
      </ShowIf>

      {/* Componentes de aplicación */}
      <div style={{ marginTop: '1rem' }}>
        <h4>Componentes</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#d1ecf1',
              borderRadius: '4px',
            }}
          >
            <h5>Dashboard Principal</h5>
            <p>
              Acceso:{' '}
              {getRoles(context).some((r) => ['app_owner', 'app_member'].includes(r)) ? '✅' : '❌'}
            </p>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#d1ecf1',
              borderRadius: '4px',
            }}
          >
            <h5>Reportes Avanzados</h5>
            <p>Acceso: {getRoles(context).some((r) => r === 'app_owner') ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MFE: TEAMS
 * Gestión de equipos dentro de una aplicación
 */
interface TeamsMFEProps {
  companyId: string;
  applicationId: string;
}

export function TeamsMFE({ companyId, applicationId }: TeamsMFEProps) {
  const { getRoles } = useHierarchicalPermissions();

  const context: PermissionContext = {
    companyId,
    applicationId,
  };

  const rolesInContext = getRoles(context);
  const mockTeams = [
    { id: 'team-1', name: 'Frontend', members: 5 },
    { id: 'team-2', name: 'Backend', members: 3 },
  ];

  return (
    <div style={{ border: '2px solid #e74c3c', padding: '1rem', borderRadius: '8px' }}>
      <h3>👥 Equipos</h3>

      <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ecf0f1' }}>
        <p>
          <strong>Mi nivel:</strong>{' '}
          {rolesInContext.includes('team_owner') ? '👑 Team Owner' : '👤 Member'}
        </p>
      </div>

      <ShowIf componentId="company.team.members_list" action="add_member">
        <button
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Agregar Miembro al Equipo
        </button>
      </ShowIf>

      {mockTeams.map((team) => (
        <div
          key={team.id}
          style={{
            padding: '1rem',
            marginBottom: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderLeft: '3px solid #e74c3c',
          }}
        >
          <h5>{team.name}</h5>
          <p style={{ margin: '0.5rem 0', fontSize: '14px' }}>Miembros: {team.members}</p>
          <div>
            <ShowIf componentId="company.team.members_list" action="remove_member">
              <button style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}>
                Remover Miembro
              </button>
            </ShowIf>
          </div>
        </div>
      ))}
    </div>
  );
}
