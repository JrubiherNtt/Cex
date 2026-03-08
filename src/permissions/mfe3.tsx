// mfe3.tsx
import React from 'react';
import { useHierarchicalPermissions } from './useHierarchicalPermissions';

export interface MFE3Props {
  companyId: string;
  applicationId: string;
}

export function MFE3({ companyId, applicationId }: MFE3Props) {
  const { getRoles } = useHierarchicalPermissions();
  const roles = getRoles({ companyId, applicationId });

  return (
    <div style={{ border: '1px solid green', padding: 8, margin: 8 }}>
      <h3>MFE3 (independent)</h3>
      <p>Roles available: {roles.join(', ')}</p>
    </div>
  );
}
