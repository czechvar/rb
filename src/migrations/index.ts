import * as migration_20260527_124751 from './20260527_124751';
import * as migration_20260527_125021 from './20260527_125021';
import * as migration_20260528_135559_demo_block_fields from './20260528_135559_demo_block_fields';
import * as migration_20260531_212859_orders from './20260531_212859_orders';
import * as migration_20260601_214850_event_dates_virtual_capacity from './20260601_214850_event_dates_virtual_capacity';
import * as migration_20260612_190144_guide_role_section from './20260612_190144_guide_role_section';
import * as migration_20260612_192135_location_destination_fields from './20260612_192135_location_destination_fields';
import * as migration_20260612_194330_blog_posts from './20260612_194330_blog_posts';
import * as migration_20260615_201358_add_discount_referral_collections from './20260615_201358_add_discount_referral_collections';

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
    name: '20260531_212859_orders',
  },
  {
    up: migration_20260601_214850_event_dates_virtual_capacity.up,
    down: migration_20260601_214850_event_dates_virtual_capacity.down,
    name: '20260601_214850_event_dates_virtual_capacity',
  },
  {
    up: migration_20260612_190144_guide_role_section.up,
    down: migration_20260612_190144_guide_role_section.down,
    name: '20260612_190144_guide_role_section',
  },
  {
    up: migration_20260612_192135_location_destination_fields.up,
    down: migration_20260612_192135_location_destination_fields.down,
    name: '20260612_192135_location_destination_fields',
  },
  {
    up: migration_20260612_194330_blog_posts.up,
    down: migration_20260612_194330_blog_posts.down,
    name: '20260612_194330_blog_posts',
  },
  {
    up: migration_20260615_201358_add_discount_referral_collections.up,
    down: migration_20260615_201358_add_discount_referral_collections.down,
    name: '20260615_201358_add_discount_referral_collections'
  },
];
