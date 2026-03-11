// shell-chain-example.tsx
// Demonstrates Shell coordinating MFEs: MFE1 (which consumes MFE2) and MFE3.

import { useState } from 'react';
import { PermissionsProvider } from '../context/permissions-context';
import { defaultPermissionConfig } from '../core/config';
import { createAffiliationEvaluator } from '../hierarchical/hierarchical';
import { MFE1 } from './mfe1';
import { MFE3 } from './mfe3';
import type { UserWithAffiliations } from '../hierarchical/affiliations';

const demoUser: UserWithAffiliations = {
  id: 'chain-user',
  name: 'Chain User',
  email: 'chain@example.com',
  globalRoles: ['user'],
  companies: [
    {
      id: 'company-chain',
      name: 'Chain Co',
      roles: ['company_owner'],
      applications: [
        {
          id: 'app-chain',
          name: 'Chain App',
          roles: ['app_member'],
          teams: [],
        },
      ],
    },
  ],
};

export function ShellChainExample() {
  const [companyId] = useState('company-chain');
  const [applicationId] = useState('app-chain');

  return (
    <PermissionsProvider
      user={demoUser}
      config={defaultPermissionConfig}
      evaluator={createAffiliationEvaluator()}
    >
      <div>
        <h2>Shell with chained MFEs</h2>
        <MFE1 companyId={companyId} applicationId={applicationId} />
        <MFE3 companyId={companyId} applicationId={applicationId} />
      </div>
    </PermissionsProvider>
  );
}
