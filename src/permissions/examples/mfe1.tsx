// mfe1.tsx
import { MFE2 } from './mfe2';
import { useHierarchicalPermissions } from '../useHierarchicalPermissions';

export interface MFE1Props {
  companyId: string;
  applicationId: string;
}

export function MFE1({ companyId, applicationId }: MFE1Props) {
  const { getRoles } = useHierarchicalPermissions();
  const roles = getRoles({ companyId, applicationId });

  return (
    <div style={{ border: '1px solid blue', padding: 8, margin: 8 }}>
      <h3>MFE1 (consumes MFE2)</h3>
      <p>Context roles: {roles.join(', ')}</p>
      <MFE2 companyId={companyId} applicationId={applicationId} />
    </div>
  );
}
