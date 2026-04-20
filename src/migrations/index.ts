import * as migration_20260420_123504 from './20260420_123504';

export const migrations = [
  {
    up: migration_20260420_123504.up,
    down: migration_20260420_123504.down,
    name: '20260420_123504'
  },
];
