import { UserWithAffiliations } from '../../hierarchical/affiliations';

const companyA = {
  id: 'company-1',
  name: 'Company A',
  roles: ['company_owner'],
  applications: [
    {
      id: 'app-1',
      name: 'App A',
      roles: ['app_owner'],
      teams: [
        {
          id: 'team-1',
          name: 'Team A',
          roles: ['team_owner'],
        },
      ],
    },
  ],
};

export const baseMockUserWithAffiliations: UserWithAffiliations = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  globalRoles: ['user'],
  companies: [companyA],
  applications: [
    {
      id: 'global-app-1',
      name: 'Global App',
      roles: ['app_member'],
      teams: [
        {
          id: 'global-team-1',
          name: 'Global Team',
          roles: ['team_member'],
        },
      ],
    },
  ],
};

export const extendedAffiliationsMockUser: UserWithAffiliations = {
  ...baseMockUserWithAffiliations,
  globalRoles: ['user', 'anonymous'],
  companies: [
    {
      ...companyA,
      applications: [
        ...(companyA.applications || []),
        {
          id: 'app-2',
          name: 'App B',
          roles: ['app_member'],
        },
      ],
    },
    {
      id: 'company-2',
      name: 'Company B',
      roles: ['company_member'],
    },
  ],
};

export const baseMockUserWithStandaloneTeam: UserWithAffiliations = {
  ...baseMockUserWithAffiliations,
  teams: [
    {
      id: 'global-team-standalone',
      name: 'Standalone Team',
      roles: ['team_standalone'],
    },
  ],
};
