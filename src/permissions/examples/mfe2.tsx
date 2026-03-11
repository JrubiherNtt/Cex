// mfe2.tsx
import { useHierarchicalPermissions } from '../hierarchical/useHierarchicalPermissions';

export interface MFE2Props {
  companyId: string;
  applicationId: string;
}

export function MFE2({ companyId, applicationId }: MFE2Props) {
  const { getRoles } = useHierarchicalPermissions();
  const roles = getRoles({ companyId, applicationId });

  return (
    <div style={{ border: '1px solid #ccc', padding: 8, margin: 8 }}>
      <h4>MFE2 (nested inside MFE1)</h4>
      <p>Roles in context: {roles.join(', ')}</p>
    </div>
  );
}
