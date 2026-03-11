import {
  createAffiliationEvaluator,
  createContext,
  getEffectiveRoles,
} from '../hierarchical/hierarchical';
import { UserWithAffiliations, PermissionContext } from '../hierarchical/affiliations';
import { Attributes, StaticPermission } from '../core/types';
import { baseMockUserWithAffiliations } from './fixtures/hierarchical-users';

const mockUser: UserWithAffiliations = baseMockUserWithAffiliations;

describe('createAffiliationEvaluator', () => {
  const evaluate = createAffiliationEvaluator();

  describe('user without globalRoles', () => {
    it('should return false when user has no globalRoles', () => {
      const userNoRoles = {} as UserWithAffiliations;
      const policy: StaticPermission = { action: 'read', resource: 'document' };
      expect(evaluate(policy, userNoRoles as unknown as Attributes, {})).toBe(false);
    });

    it('should return false when user is null-ish', () => {
      const policy: StaticPermission = { action: 'read', resource: 'document' };
      expect(evaluate(policy, {} as Attributes, {})).toBe(false);
    });
  });

  describe('static policy (object with action and resource)', () => {
    it('should return true when action and resource match', () => {
      const policy: StaticPermission = { action: 'read', resource: 'document' };
      const user: Attributes = { ...mockUser, action: 'read' };
      const resource: Attributes = { id: 'document' };
      expect(evaluate(policy, user, resource)).toBe(true);
    });

    it('should return true when resource is matched by plain value (no id)', () => {
      const policy: StaticPermission = { action: 'edit', resource: 'report' };
      const user: Attributes = { ...mockUser, action: 'edit' };
      expect(evaluate(policy, user, 'report' as unknown as Attributes)).toBe(true);
    });

    it('should return false when action does not match', () => {
      const policy: StaticPermission = { action: 'delete', resource: 'document' };
      const user: Attributes = { ...mockUser, action: 'read' };
      const resource: Attributes = { id: 'document' };
      expect(evaluate(policy, user, resource)).toBe(false);
    });

    it('should return false when resource does not match', () => {
      const policy: StaticPermission = { action: 'read', resource: 'document' };
      const user: Attributes = { ...mockUser, action: 'read' };
      const resource: Attributes = { id: 'other-resource' };
      expect(evaluate(policy, user, resource)).toBe(false);
    });

    it('should return false when both action and resource do not match', () => {
      const policy: StaticPermission = { action: 'delete', resource: 'secret' };
      const user: Attributes = { ...mockUser, action: 'read' };
      const resource: Attributes = { id: 'document' };
      expect(evaluate(policy, user, resource)).toBe(false);
    });
  });

  describe('dynamic function-based policy', () => {
    it('should invoke the policy function and return its result (true)', () => {
      const policy: (u: Attributes, r: Attributes, c?: Attributes) => boolean = () => true;
      expect(evaluate(policy, mockUser as unknown as Attributes, {})).toBe(true);
    });

    it('should invoke the policy function and return its result (false)', () => {
      const policy: (u: Attributes, r: Attributes, c?: Attributes) => boolean = () => false;
      expect(evaluate(policy, mockUser as unknown as Attributes, {})).toBe(false);
    });

    it('should pass user, resource, and context to the policy function', () => {
      const resource: Attributes = { id: 'doc-1' };
      const context: PermissionContext = { companyId: 'company-1' };
      const policy = (u: Attributes, r: Attributes, c?: Attributes) =>
        u['id'] === 'user-1' && r['id'] === 'doc-1' && c?.['companyId'] === 'company-1';
      expect(evaluate(policy, mockUser as unknown as Attributes, resource, context)).toBe(true);
    });
  });

  describe('unknown policy type', () => {
    it('should return false for a non-function, non-object policy', () => {
      const user = mockUser as unknown as Attributes;
      expect(evaluate(null, user, {})).toBe(false);
      expect(evaluate(undefined, user, {})).toBe(false);
      expect(evaluate(42, user, {})).toBe(false);
    });
  });

  describe('with context', () => {
    it('should accept a context argument without throwing', () => {
      const policy: StaticPermission = { action: 'read', resource: 'page' };
      const user: Attributes = { ...mockUser, action: 'read' };
      const context: PermissionContext = { companyId: 'company-1', applicationId: 'app-1' };
      expect(evaluate(policy, user, 'page' as unknown as Attributes, context)).toBe(true);
    });
  });
});

describe('createContext', () => {
  it('should create a context with all three IDs', () => {
    const ctx = createContext('company-1', 'app-1', 'team-1');
    expect(ctx).toEqual({ companyId: 'company-1', applicationId: 'app-1', teamId: 'team-1' });
  });

  it('should create a context with only companyId', () => {
    const ctx = createContext('company-1');
    expect(ctx).toEqual({ companyId: 'company-1', applicationId: undefined, teamId: undefined });
  });

  it('should create a context with only applicationId', () => {
    const ctx = createContext(undefined, 'app-1');
    expect(ctx).toEqual({ companyId: undefined, applicationId: 'app-1', teamId: undefined });
  });

  it('should create a context with only teamId', () => {
    const ctx = createContext(undefined, undefined, 'team-1');
    expect(ctx).toEqual({ companyId: undefined, applicationId: undefined, teamId: 'team-1' });
  });

  it('should create an empty context when called with no arguments', () => {
    const ctx = createContext();
    expect(ctx).toEqual({ companyId: undefined, applicationId: undefined, teamId: undefined });
  });
});

describe('getEffectiveRoles', () => {
  it('should return global roles when no context is provided', () => {
    const roles = getEffectiveRoles(mockUser);
    expect(roles).toContain('user');
  });

  it('should return global and company roles with companyId context', () => {
    const context = createContext('company-1');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toContain('user');
    expect(roles).toContain('company_owner');
  });

  it('should return global, company and app roles with company + app context', () => {
    const context = createContext('company-1', 'app-1');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toContain('user');
    expect(roles).toContain('company_owner');
    expect(roles).toContain('app_owner');
  });

  it('should return all roles in full hierarchy context', () => {
    const context = createContext('company-1', 'app-1', 'team-1');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toContain('user');
    expect(roles).toContain('company_owner');
    expect(roles).toContain('app_owner');
    expect(roles).toContain('team_owner');
  });

  it('should return global app roles with applicationId-only context', () => {
    const context = createContext(undefined, 'global-app-1');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toContain('app_member');
  });

  it('should return global team roles with applicationId + teamId context', () => {
    const context = createContext(undefined, 'global-app-1', 'global-team-1');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toContain('app_member');
    expect(roles).toContain('team_member');
  });

  it('should return only global roles for unknown companyId', () => {
    const context = createContext('company-999');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toEqual(['user']);
  });

  it('should return only global roles for unknown applicationId', () => {
    const context = createContext(undefined, 'app-999');
    const roles = getEffectiveRoles(mockUser, context);
    expect(roles).toEqual(['user']);
  });
});
