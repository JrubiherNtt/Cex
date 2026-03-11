/**
 * Example: Using hierarchical permissions with affiliations
 * Demonstrates how to work with the nested structure
 */

import { useState } from 'react';
import { PermissionsProvider } from '../context/permissions-context';
import { useHierarchicalPermissions } from '../hierarchical/useHierarchicalPermissions';
import {
  UserWithAffiliations,
  PermissionContext,
} from '../hierarchical/affiliations';
import { createAffiliationEvaluator } from '../hierarchical/hierarchical';
import { defaultPermissionConfig } from '../core/config';

// Mock user with hierarchical affiliations
const mockUserWithAffiliations: UserWithAffiliations = {
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

// Component demonstrating hierarchical permissions
function HierarchicalExample() {
  const {
    getRoles,
    getCompanies,
    getApplicationsInCompany,
    user,
  } = useHierarchicalPermissions();

  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(
    'company-1'
  );
  const [selectedApp, setSelectedApp] = useState<string | undefined>('app-1');

  const companies = getCompanies();
  const appsInCompany = selectedCompany
    ? getApplicationsInCompany(selectedCompany)
    : [];

  // Get roles in the current context
  const context: PermissionContext = {
    companyId: selectedCompany,
    applicationId: selectedApp,
  };
  const effectiveRoles = getRoles(context);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Hierarchical Permissions Example</h1>

      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h2>User: {user.name}</h2>
        <p>Global Roles: {user.globalRoles.join(', ')}</p>
      </div>

      {/* Company Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Available Companies</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                setSelectedCompany(company.id);
                setSelectedApp(company.applications?.[0]?.id);
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedCompany === company.id ? '#007bff' : '#ccc',
                color: selectedCompany === company.id ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {company.name} ({company.roles.join(', ')})
            </button>
          ))}
        </div>
      </div>

      {/* Application Selection */}
      {selectedCompany && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Applications in {companies.find(c => c.id === selectedCompany)?.name}</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {appsInCompany.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app.id)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedApp === app.id ? '#28a745' : '#ccc',
                  color: selectedApp === app.id ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {app.name} ({app.roles.join(', ')})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context Info */}
      {selectedCompany && selectedApp && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#e8f5e9',
            borderRadius: '4px',
          }}
        >
          <h3>Effective Roles in This Context</h3>
          <p>
            <strong>Roles:</strong> {effectiveRoles.join(', ')}
          </p>
          <pre style={{ backgroundColor: '#fff', padding: '0.5rem' }}>
            {JSON.stringify(
              {
                companyId: selectedCompany,
                applicationId: selectedApp,
                roles: effectiveRoles,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

// Main app with provider
export function HierarchicalExampleApp() {
  const evaluator = createAffiliationEvaluator();

  return (
    <PermissionsProvider
      config={defaultPermissionConfig}
      user={mockUserWithAffiliations}
      evaluator={evaluator}
    >
      <HierarchicalExample />
    </PermissionsProvider>
  );
}

export default HierarchicalExampleApp;
