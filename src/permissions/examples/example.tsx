import React from 'react';
import { PermissionsProvider, usePermissions, ShowIf } from '../context/permissions-context';
import { defaultPermissionConfig } from '../core/config';

/**
 * Example App showcasing the permissions system
 */

// Mock user data
const adminUser = {
  id: 'user-1',
  name: 'Admin User',
  roles: ['admin'],
};

const companyOwnerUser = {
  id: 'user-2',
  name: 'Company Owner',
  roles: ['company_owner'],
};

const appMemberUser = {
  id: 'user-3',
  name: 'App Member',
  roles: ['app_member'],
};

const anonymousUser = {
  id: 'anonymous',
  name: 'Anonymous',
  roles: ['anonymous'],
};

// Example: Company Detail Page
function CompanyDetail() {
  const { visible, canAction } = usePermissions();

  if (!visible('company.detail')) {
    return <p>No tienes acceso a esta sección.</p>;
  }

  const canEdit = canAction('company.detail', 'edit_instances');

  return (
    <div style={{ border: '1px solid blue', padding: '1rem', margin: '1rem 0' }}>
      <h2>Detalles de Empresa</h2>

      <button disabled={!canEdit}>Editar Instancias</button>

      <ShowIf componentId="company.detail" action="edit_owners">
        <button>Cambiar Propietarios</button>
      </ShowIf>

      <ShowIf componentId="company.detail" action="show_banner">
        <div style={{ backgroundColor: '#fff3cd', padding: '0.5rem' }}>
          Banner informativo (visible para miembros y anónimos).
        </div>
      </ShowIf>
    </div>
  );
}

// Example: Applications List
function ApplicationsList() {
  const { visible } = usePermissions();

  if (!visible('applications.list')) {
    return <p>No tienes acceso a aplicaciones.</p>;
  }

  return (
    <div style={{ border: '1px solid green', padding: '1rem', margin: '1rem 0' }}>
      <h2>Aplicaciones</h2>

      <ShowIf componentId="applications.list" action="create">
        <button>+ Nueva Aplicación</button>
      </ShowIf>

      <ShowIf componentId="applications.list" action="my_applications">
        <button>Mis Aplicaciones</button>
      </ShowIf>

      <ul>
        <li>App A</li>
        <li>App B</li>
      </ul>
    </div>
  );
}

// Example: Team Members List
function TeamMembersList() {
  const { visible } = usePermissions();

  if (!visible('company.team.members_list')) {
    return <p>No tienes acceso a los miembros del equipo.</p>;
  }

  return (
    <div style={{ border: '1px solid purple', padding: '1rem', margin: '1rem 0' }}>
      <h2>Miembros del Equipo</h2>

      <ShowIf componentId="company.team.members_list" action="add_member">
        <button>+ Agregar Miembro</button>
      </ShowIf>

      <ul>
        <li>
          User 1
          <ShowIf componentId="company.team.members_list" action="remove_member">
            <button style={{ marginLeft: '0.5rem' }}>Eliminar</button>
          </ShowIf>
        </li>
      </ul>
    </div>
  );
}

// Example: Top navigation showing different UI for user context
function Navigation() {
  const { user } = usePermissions();

  return (
    <nav style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
      <h3>
        {user.name} ({user.roles.join(', ')})
      </h3>
    </nav>
  );
}

// Main App component
export function ExampleApp() {
  const [currentUser, setCurrentUser] = React.useState(adminUser);

  return (
    <PermissionsProvider config={defaultPermissionConfig} user={currentUser}>
      <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
        <h1>Permission System Example</h1>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setCurrentUser(adminUser)}>Admin</button>
          <button onClick={() => setCurrentUser(companyOwnerUser)}>Company Owner</button>
          <button onClick={() => setCurrentUser(appMemberUser)}>App Member</button>
          <button onClick={() => setCurrentUser(anonymousUser)}>Anonymous</button>
        </div>

        <Navigation />

        <CompanyDetail />
        <ApplicationsList />
        <TeamMembersList />
      </div>
    </PermissionsProvider>
  );
}

export default ExampleApp;
