import * as migration_20260527_124751 from './20260527_124751';
import * as migration_20260527_125021 from './20260527_125021';
import * as migration_20260528_135559_demo_block_fields from './20260528_135559_demo_block_fields';
import * as migration_20260531_212859_orders from './20260531_212859_orders';

export const migrations = [
  {
    up: migration_20260527_124751.up,
    down: migration_20260527_124751.down,
    name: '20260527_124751',
  },
  {
    up: migration_20260527_125021.up,
    down: migration_20260527_125021.down,
    name: '20260527_125021',
  },
  {
    up: migration_20260528_135559_demo_block_fields.up,
    down: migration_20260528_135559_demo_block_fields.down,
    name: '20260528_135559_demo_block_fields',
  },
  {
    up: migration_20260531_212859_orders.up,
    down: migration_20260531_212859_orders.down,
    name: '20260531_212859_orders'
  },
];
