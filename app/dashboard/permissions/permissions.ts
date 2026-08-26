export const permissionModules = [
  {
    name: 'Questions',
    permissions: [
      'questions.create',
      'questions.read',
      'questions.update',
      'questions.delete',
      'questions.upload',
    ],
  },
  {
    name: 'Rounds',
    permissions: [
      'rounds.create',
      'rounds.read',
      'rounds.update',
      'rounds.delete',
    ],
  },
  {
    name: 'Games',
    permissions: [
      'games.create',
      'games.read',
      'games.update',
      'games.delete',
      'games.play',
    ],
  },
  {
    name: 'Users',
    permissions: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
    ],
  },
  {
    name: 'Dashboard',
    permissions: [
      'dashboard.view',
      'dashboard.stats',
      'dashboard.activity',
    ],
  },
  {
    name: 'Configuration',
    permissions: [
      'configuration.view',
      'configuration.update',
      'configuration.manage',
    ],
  },
];
