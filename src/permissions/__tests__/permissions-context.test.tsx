// @vitest-environment jsdom
import { render, renderHook, screen } from '@testing-library/react';
import { PermissionsProvider, ShowIf, usePermissions } from '../context/permissions-context';
import { Attributes } from '../core/types';
import { CreatePermissionsOpts } from '../core/types';

const renderHookWithProvider = (providerProps: CreatePermissionsOpts & { user: Attributes }) => {
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <PermissionsProvider {...providerProps}>{children}</PermissionsProvider>
  );

  return renderHook(() => usePermissions(), { wrapper: Wrapper });
};

const renderShowIfWithProvider = ({
  config,
  user,
  action,
  resource,
  componentId,
  fallback,
}: {
  config: CreatePermissionsOpts['config'];
  user: Attributes;
  action?: string;
  resource?: Attributes | string;
  componentId?: string;
  fallback?: React.ReactNode;
}) => {
  return render(
    <PermissionsProvider config={config} user={user}>
      <ShowIf action={action} resource={resource} componentId={componentId} fallback={fallback}>
        <div>ALLOWED_CONTENT</div>
      </ShowIf>
    </PermissionsProvider>,
  );
};

describe('PermissionsContext', () => {
  it('should throw error when usePermissions is used outside provider', () => {
    // This test intentionally doesn't use the provider
    expect(() => {
      renderHook(() => usePermissions());
    }).toThrowError('usePermissions must be used within a PermissionsProvider');
  });

  it('should provide permissions and user context', () => {
    const mockConfig = {
      roles: {
        admin: [{ action: 'read', resource: 'document' }],
      },
    };
    const mockUser = { id: 'user1', name: 'Test User' };
    const { result } = renderHookWithProvider({ config: mockConfig, user: mockUser });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.can).toBeDefined();
    expect(result.current.visible).toBeDefined();
    expect(result.current.canAction).toBeDefined();
  });

  it('should overwrite permissions when provider props change', () => {
    const mockConfig1 = {
      roles: {
        admin: [{ action: 'read', resource: 'document' }],
      },
    };
    const mockConfig2 = {
      roles: {
        admin: [{ action: 'write', resource: 'document' }],
      },
    };
    const mockUser = { id: 'user1', name: 'Test User', roles: ['admin'] };
    const { result: initialResult } = renderHookWithProvider({
      config: mockConfig1,
      user: mockUser,
    });

    expect(initialResult.current.can('read', 'document')).toBe(true);
    expect(initialResult.current.can('write', 'document')).toBe(false);

    const { result: updatedResult } = renderHookWithProvider({
      config: mockConfig2,
      user: mockUser,
    });

    expect(updatedResult.current.can('read', 'document')).toBe(false);
    expect(updatedResult.current.can('write', 'document')).toBe(true);
  });

  describe('ShowIf', () => {
    const showIfConfig: CreatePermissionsOpts['config'] = {
      roles: {
        admin: [{ action: 'read', resource: 'document' }],
      },
      layouts: {
        company: {
          detail: {
            show: ['admin'],
            actions: {
              edit_instances: ['admin'],
            },
          },
        },
      },
    };

    it('should render children when component action is allowed', () => {
      const user = { id: 'u1', roles: ['admin'] };

      renderShowIfWithProvider({
        config: showIfConfig,
        user,
        componentId: 'company.detail',
        action: 'edit_instances',
        fallback: <div>FALLBACK_CONTENT</div>,
      });

      expect(screen.getByText('ALLOWED_CONTENT')).toBeTruthy();
      expect(screen.queryByText('FALLBACK_CONTENT')).toBeNull();
    });

    it('should render fallback when component action is denied', () => {
      const user = { id: 'u2', roles: ['viewer'] };

      renderShowIfWithProvider({
        config: showIfConfig,
        user,
        componentId: 'company.detail',
        action: 'edit_instances',
        fallback: <div>FALLBACK_CONTENT</div>,
      });

      expect(screen.queryByText('ALLOWED_CONTENT')).toBeNull();
      expect(screen.getByText('FALLBACK_CONTENT')).toBeTruthy();
    });

    it('should render children when component is visible', () => {
      const user = { id: 'u3', roles: ['admin'] };

      renderShowIfWithProvider({
        config: showIfConfig,
        user,
        componentId: 'company.detail',
        fallback: <div>FALLBACK_CONTENT</div>,
      });

      expect(screen.getByText('ALLOWED_CONTENT')).toBeTruthy();
      expect(screen.queryByText('FALLBACK_CONTENT')).toBeNull();
    });

    it('should render children when action and resource are allowed', () => {
      const user = { id: 'u4', roles: ['admin'] };

      renderShowIfWithProvider({
        config: showIfConfig,
        user,
        action: 'read',
        resource: 'document',
        fallback: <div>FALLBACK_CONTENT</div>,
      });

      expect(screen.getByText('ALLOWED_CONTENT')).toBeTruthy();
      expect(screen.queryByText('FALLBACK_CONTENT')).toBeNull();
    });

    it('should render fallback when action and resource are denied', () => {
      const user = { id: 'u5', roles: ['admin'] };

      renderShowIfWithProvider({
        config: showIfConfig,
        user,
        action: 'write',
        resource: 'document',
        fallback: <div>FALLBACK_CONTENT</div>,
      });

      expect(screen.queryByText('ALLOWED_CONTENT')).toBeNull();
      expect(screen.getByText('FALLBACK_CONTENT')).toBeTruthy();
    });
  });
});
