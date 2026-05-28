import * as migration_20260527_124751 from './20260527_124751';
import * as migration_20260527_125021 from './20260527_125021';
import * as migration_20260528_074156 from './20260528_074156';

export const migrations = [
  {
    up: migration_20260527_124751.up,
    down: migration_20260527_124751.down,
    name: '20260527_124751',
  },
  {
    up: migration_20260527_125021.up,
    down: migration_20260527_125021.down,
    name: '20260527_125021'
  },
  {
    up: migration_20260528_074156.up,
    down: migration_20260528_074156.down,
    name: '20260528_074156'
  },
];
