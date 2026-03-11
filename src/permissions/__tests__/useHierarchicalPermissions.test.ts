// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useHierarchicalPermissions } from '../hierarchical/useHierarchicalPermissions';
import { UserWithAffiliations } from '../hierarchical/affiliations';
import { baseMockUserWithStandaloneTeam } from './fixtures/hierarchical-users';

vi.mock('../context/permissions-context', () => ({
  usePermissions: vi.fn(),
}));

import { usePermissions } from '../context/permissions-context';

const mockUserFull: UserWithAffiliations = baseMockUserWithStandaloneTeam;

describe('useHierarchicalPermissions', () => {
  const mockCan = vi.fn();
  const mockVisible = vi.fn();
  const mockCanAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
      can: mockCan,
      visible: mockVisible,
      canAction: mockCanAction,
      user: mockUserFull,
    });
  });

  it('should expose can, visible, canAction from usePermissions', () => {
    const { result } = renderHook(() => useHierarchicalPermissions());

    expect(result.current.can).toBe(mockCan);
    expect(result.current.visible).toBe(mockVisible);
    expect(result.current.canAction).toBe(mockCanAction);
  });

  it('should cast user to UserWithAffiliations', () => {
    const { result } = renderHook(() => useHierarchicalPermissions());

    expect(result.current.user).toEqual(mockUserFull);
  });

  it('should expose all hierarchical methods', () => {
    const { result } = renderHook(() => useHierarchicalPermissions());

    expect(result.current.getRoles).toBeDefined();
    expect(result.current.hasAffiliation).toBeDefined();
    expect(result.current.canInContext).toBeDefined();
    expect(result.current.getCompanies).toBeDefined();
    expect(result.current.getApplicationsInCompany).toBeDefined();
    expect(result.current.canAccessCompany).toBeDefined();
    expect(result.current.canAccessApplication).toBeDefined();
    expect(result.current.canActionInApplication).toBeDefined();
  });

  describe('getRoles', () => {
    it('should return global roles when no context is provided', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.getRoles()).toEqual(['user']);
    });

    it('should return global roles plus company roles for a company context', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const roles = result.current.getRoles({ companyId: 'company-1' });
      expect(roles).toContain('user');
      expect(roles).toContain('company_owner');
    });

    it('should return global + company + app roles for a company+app context', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const roles = result.current.getRoles({ companyId: 'company-1', applicationId: 'app-1' });
      expect(roles).toContain('user');
      expect(roles).toContain('company_owner');
      expect(roles).toContain('app_owner');
    });

    it('should return global + company + app + team roles for full context', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const roles = result.current.getRoles({
        companyId: 'company-1',
        applicationId: 'app-1',
        teamId: 'team-1',
      });
      expect(roles).toContain('user');
      expect(roles).toContain('company_owner');
      expect(roles).toContain('app_owner');
      expect(roles).toContain('team_owner');
    });

    it('should return only global roles when company context does not exist', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const roles = result.current.getRoles({ companyId: 'unknown-company' });
      expect(roles).toEqual(['user']);
    });

    it('should return roles for a global application context (no company)', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const roles = result.current.getRoles({ applicationId: 'global-app-1' });
      expect(roles).toContain('user');
      expect(roles).toContain('app_member');
    });

    it('should return roles for a global team context (no company or app)', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const roles = result.current.getRoles({ teamId: 'global-team-standalone' });
      expect(roles).toContain('user');
      expect(roles).toContain('team_standalone');
    });
  });

  describe('hasAffiliation', () => {
    it('should return true when user is affiliated with a known company', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('company', 'company-1')).toBe(true);
    });

    it('should return false when user is not affiliated with the company', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('company', 'unknown-company')).toBe(false);
    });

    it('should return true for a global application the user is affiliated with', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('application', 'global-app-1')).toBe(true);
    });

    it('should return true for an application nested within a company', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('application', 'app-1')).toBe(true);
    });

    it('should return false for an application not affiliated with the user', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('application', 'unknown-app')).toBe(false);
    });

    it('should return true for a global team the user is affiliated with', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('team', 'global-team-standalone')).toBe(true);
    });

    it('should return true for a team nested within a global application', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('team', 'global-team-1')).toBe(true);
    });

    it('should return true for a team nested within a company application', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('team', 'team-1')).toBe(true);
    });

    it('should return false for a team not affiliated with the user', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.hasAffiliation('team', 'unknown-team')).toBe(false);
    });
  });

  describe('canInContext', () => {
    it('should call can with action and resource merged with context', () => {
      mockCan.mockReturnValue(true);
      const { result } = renderHook(() => useHierarchicalPermissions());

      const allowed = result.current.canInContext('read', 'document', { companyId: 'company-1' });

      expect(mockCan).toHaveBeenCalledWith('read', { id: 'document', companyId: 'company-1' });
      expect(allowed).toBe(true);
    });

    it('should call can with only the resource id when no context is provided', () => {
      mockCan.mockReturnValue(false);
      const { result } = renderHook(() => useHierarchicalPermissions());

      const allowed = result.current.canInContext('delete', 'report');

      expect(mockCan).toHaveBeenCalledWith('delete', { id: 'report' });
      expect(allowed).toBe(false);
    });

    it('should pass full context including applicationId and teamId', () => {
      mockCan.mockReturnValue(true);
      const { result } = renderHook(() => useHierarchicalPermissions());

      result.current.canInContext('write', 'resource-x', {
        companyId: 'company-1',
        applicationId: 'app-1',
        teamId: 'team-1',
      });

      expect(mockCan).toHaveBeenCalledWith('write', {
        id: 'resource-x',
        companyId: 'company-1',
        applicationId: 'app-1',
        teamId: 'team-1',
      });
    });
  });

  describe('getCompanies', () => {
    it('should return the user companies list', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.getCompanies()).toEqual(mockUserFull.companies);
    });

    it('should return empty array when user has no companies', () => {
      (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
        can: mockCan,
        visible: mockVisible,
        canAction: mockCanAction,
        user: { ...mockUserFull, companies: undefined },
      });
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.getCompanies()).toEqual([]);
    });
  });

  describe('getApplicationsInCompany', () => {
    it('should return applications for a known company', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      const apps = result.current.getApplicationsInCompany('company-1');
      expect(apps).toEqual(mockUserFull.companies![0].applications);
    });

    it('should return empty array for an unknown company', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.getApplicationsInCompany('unknown-company')).toEqual([]);
    });

    it('should return empty array when company has no applications', () => {
      (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
        can: mockCan,
        visible: mockVisible,
        canAction: mockCanAction,
        user: {
          ...mockUserFull,
          companies: [{ id: 'company-2', name: 'Company B', roles: ['member'] }],
        },
      });
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.getApplicationsInCompany('company-2')).toEqual([]);
    });
  });

  describe('canAccessCompany', () => {
    it('should return true for a company the user belongs to', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.canAccessCompany('company-1')).toBe(true);
    });

    it('should return false for a company the user does not belong to', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.canAccessCompany('unknown-company')).toBe(false);
    });
  });

  describe('canAccessApplication', () => {
    it('should return true for a global application the user has access to', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.canAccessApplication('global-app-1')).toBe(true);
    });

    it('should return true for an application nested within a company', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.canAccessApplication('app-1')).toBe(true);
    });

    it('should return false for an application the user does not have access to', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.canAccessApplication('unknown-app')).toBe(false);
    });
  });

  describe('canActionInApplication', () => {
    it('should return true when user has roles in the given app+company context', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      // user has globalRoles + company_owner + app_owner for company-1/app-1
      expect(result.current.canActionInApplication('app-1', 'company-1')).toBe(true);
    });

    it('should return true when user has global application access (no company)', () => {
      const { result } = renderHook(() => useHierarchicalPermissions());

      // global-app-1 is accessible without a company
      expect(result.current.canActionInApplication('global-app-1', undefined)).toBe(true);
    });

    it('should return false when user has no roles at all', () => {
      (usePermissions as ReturnType<typeof vi.fn>).mockReturnValue({
        can: mockCan,
        visible: mockVisible,
        canAction: mockCanAction,
        user: {
          id: 'user-empty',
          name: 'Empty User',
          email: 'empty@example.com',
          globalRoles: [],
        } as unknown as UserWithAffiliations,
      });
      const { result } = renderHook(() => useHierarchicalPermissions());

      expect(result.current.canActionInApplication('unknown-app', 'unknown-company')).toBe(false);
    });
  });
});
