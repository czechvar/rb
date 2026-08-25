import * as migration_20260527_124751 from './20260527_124751';
import * as migration_20260527_125021 from './20260527_125021';
import * as migration_20260528_135559_demo_block_fields from './20260528_135559_demo_block_fields';
import * as migration_20260531_212859_orders from './20260531_212859_orders';
import * as migration_20260601_214850_event_dates_virtual_capacity from './20260601_214850_event_dates_virtual_capacity';
import * as migration_20260612_190144_guide_role_section from './20260612_190144_guide_role_section';
import * as migration_20260612_192135_location_destination_fields from './20260612_192135_location_destination_fields';
import * as migration_20260612_194330_blog_posts from './20260612_194330_blog_posts';
import * as migration_20260615_201358_add_discount_referral_collections from './20260615_201358_add_discount_referral_collections';
import * as migration_20260623_223014_orders_discount_referral_fields from './20260623_223014_orders_discount_referral_fields';
import * as migration_20260625_065828_add_guides_is_founder from './20260625_065828_add_guides_is_founder';
import * as migration_20260706_122432_add_guide_tagline_tags from './20260706_122432_add_guide_tagline_tags';
import * as migration_20260708_160917_add_guide_detail_fields from './20260708_160917_add_guide_detail_fields';
import * as migration_20260730_060650_rename_types_to_programs from './20260730_060650_rename_types_to_programs';
import * as migration_20260824_220848_add_pages_collection from './20260824_220848_add_pages_collection';
import * as migration_20260825_115412_add_generic_page_blocks from './20260825_115412_add_generic_page_blocks';
import * as migration_20260825_125431_add_domain_page_blocks from './20260825_125431_add_domain_page_blocks';

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
    name: '20260615_201358_add_discount_referral_collections',
  },
  {
    up: migration_20260623_223014_orders_discount_referral_fields.up,
    down: migration_20260623_223014_orders_discount_referral_fields.down,
    name: '20260623_223014_orders_discount_referral_fields',
  },
  {
    up: migration_20260625_065828_add_guides_is_founder.up,
    down: migration_20260625_065828_add_guides_is_founder.down,
    name: '20260625_065828_add_guides_is_founder',
  },
  {
    up: migration_20260706_122432_add_guide_tagline_tags.up,
    down: migration_20260706_122432_add_guide_tagline_tags.down,
    name: '20260706_122432_add_guide_tagline_tags',
  },
  {
    up: migration_20260708_160917_add_guide_detail_fields.up,
    down: migration_20260708_160917_add_guide_detail_fields.down,
    name: '20260708_160917_add_guide_detail_fields',
  },
  {
    up: migration_20260730_060650_rename_types_to_programs.up,
    down: migration_20260730_060650_rename_types_to_programs.down,
    name: '20260730_060650_rename_types_to_programs',
  },
  {
    up: migration_20260824_220848_add_pages_collection.up,
    down: migration_20260824_220848_add_pages_collection.down,
    name: '20260824_220848_add_pages_collection',
  },
  {
    up: migration_20260825_115412_add_generic_page_blocks.up,
    down: migration_20260825_115412_add_generic_page_blocks.down,
    name: '20260825_115412_add_generic_page_blocks',
  },
  {
    up: migration_20260825_125431_add_domain_page_blocks.up,
    down: migration_20260825_125431_add_domain_page_blocks.down,
    name: '20260825_125431_add_domain_page_blocks',
  },
];
