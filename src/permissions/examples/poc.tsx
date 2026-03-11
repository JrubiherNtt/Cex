// POC.tsx
// Proof-of-Concept app demonstrating basic usage of the permission library
// Run this component by importing it into a Vite/React sandbox or the example
// project for quick evaluation.

import {
  PermissionsProvider,
  usePermissions,
  ShowIf,
} from '../context/permissions-context';
import { defaultPermissionConfig } from '../core/config';
import { createAffiliationEvaluator } from '../hierarchical/hierarchical';

// sample user with hierarchical roles
const sampleUser = {
  id: 'demo-user',
  name: 'Demo User',
  globalRoles: ['user'],
  companies: [
    {
      id: 'company-demo',
      name: 'Demo Co',
      roles: ['company_owner'],
      applications: [
        {
          id: 'app-demo',
          name: 'Demo App',
          roles: ['app_member'],
          teams: [],
        },
      ],
    },
  ],
};

function Dashboard() {
  const { visible, canAction } = usePermissions();

  return (
    <div>
      <h2>Dashboard POC</h2>
      {visible('company.list') ? (
        <p>Company list is visible to user.</p>
      ) : (
        <p>Company list hidden.</p>
      )}

      <ShowIf componentId="company.detail" action="edit">
        <button>Edit company</button>
      </ShowIf>

      <ShowIf componentId="applications.list" action="create">
        <button>Create application</button>
      </ShowIf>

      <p>
        Can create instances? {canAction('company.detail', 'edit_instances') ? '✅' : '❌'}
      </p>
    </div>
  );
}

export default function POC() {
  return (
    <PermissionsProvider
      config={defaultPermissionConfig}
      user={sampleUser}
      evaluator={createAffiliationEvaluator()}
    >
      <Dashboard />
    </PermissionsProvider>
  );
}
