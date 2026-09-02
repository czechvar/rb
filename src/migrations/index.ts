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
import * as migration_20260825_133259_add_discovery_companion_page_blocks from './20260825_133259_add_discovery_companion_page_blocks';
import * as migration_20260825_151515_add_event_layout_blocks from './20260825_151515_add_event_layout_blocks';
import * as migration_20260825_155940_add_program_layout_blocks from './20260825_155940_add_program_layout_blocks';
import * as migration_20260825_163334_add_location_layout_blocks from './20260825_163334_add_location_layout_blocks';
import * as migration_20260825_170114_add_guide_layout_blocks from './20260825_170114_add_guide_layout_blocks';
import * as migration_20260825_170938_add_post_layout_blocks from './20260825_170938_add_post_layout_blocks';
import * as migration_20260825_172039_add_homepage_page_blocks from './20260825_172039_add_homepage_page_blocks';
import * as migration_20260825_192925_remove_homepage_specific_blocks from './20260825_192925_remove_homepage_specific_blocks';
import * as migration_20260826_060419_add_brand_block_variants from './20260826_060419_add_brand_block_variants';
import * as migration_20260826_082151_catalogued_block_availability from './20260826_082151_catalogued_block_availability';
import * as migration_20260826_091639_add_featured_catalogue_blocks from './20260826_091639_add_featured_catalogue_blocks';
import * as migration_20260827_145720_payload_mcp_api_keys from './20260827_145720_payload_mcp_api_keys';
import * as migration_20260901_093927_page_structured_data_schema_type from './20260901_093927_page_structured_data_schema_type';
import * as migration_20260828_122519_add_transactions from './20260828_122519_add_transactions';
import * as migration_20260901_135340_add_location_destination_taxonomy from './20260901_135340_add_location_destination_taxonomy';
import * as migration_20260901_150028_media_text_id from './20260901_150028_media_text_id';
import * as migration_20260901_190820_add_location_content_sections from './20260901_190820_add_location_content_sections';

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
  {
    up: migration_20260825_133259_add_discovery_companion_page_blocks.up,
    down: migration_20260825_133259_add_discovery_companion_page_blocks.down,
    name: '20260825_133259_add_discovery_companion_page_blocks',
  },
  {
    up: migration_20260825_151515_add_event_layout_blocks.up,
    down: migration_20260825_151515_add_event_layout_blocks.down,
    name: '20260825_151515_add_event_layout_blocks',
  },
  {
    up: migration_20260825_155940_add_program_layout_blocks.up,
    down: migration_20260825_155940_add_program_layout_blocks.down,
    name: '20260825_155940_add_program_layout_blocks',
  },
  {
    up: migration_20260825_163334_add_location_layout_blocks.up,
    down: migration_20260825_163334_add_location_layout_blocks.down,
    name: '20260825_163334_add_location_layout_blocks',
  },
  {
    up: migration_20260825_170114_add_guide_layout_blocks.up,
    down: migration_20260825_170114_add_guide_layout_blocks.down,
    name: '20260825_170114_add_guide_layout_blocks',
  },
  {
    up: migration_20260825_170938_add_post_layout_blocks.up,
    down: migration_20260825_170938_add_post_layout_blocks.down,
    name: '20260825_170938_add_post_layout_blocks',
  },
  {
    up: migration_20260825_172039_add_homepage_page_blocks.up,
    down: migration_20260825_172039_add_homepage_page_blocks.down,
    name: '20260825_172039_add_homepage_page_blocks',
  },
  {
    up: migration_20260825_192925_remove_homepage_specific_blocks.up,
    down: migration_20260825_192925_remove_homepage_specific_blocks.down,
    name: '20260825_192925_remove_homepage_specific_blocks',
  },
  {
    up: migration_20260826_060419_add_brand_block_variants.up,
    down: migration_20260826_060419_add_brand_block_variants.down,
    name: '20260826_060419_add_brand_block_variants',
  },
  {
    up: migration_20260826_082151_catalogued_block_availability.up,
    down: migration_20260826_082151_catalogued_block_availability.down,
    name: '20260826_082151_catalogued_block_availability',
  },
  {
    up: migration_20260826_091639_add_featured_catalogue_blocks.up,
    down: migration_20260826_091639_add_featured_catalogue_blocks.down,
    name: '20260826_091639_add_featured_catalogue_blocks',
  },
  {
    up: migration_20260827_145720_payload_mcp_api_keys.up,
    down: migration_20260827_145720_payload_mcp_api_keys.down,
    name: '20260827_145720_payload_mcp_api_keys',
  },
  {
    up: migration_20260901_093927_page_structured_data_schema_type.up,
    down: migration_20260901_093927_page_structured_data_schema_type.down,
    name: '20260901_093927_page_structured_data_schema_type',
  },
  {
    up: migration_20260828_122519_add_transactions.up,
    down: migration_20260828_122519_add_transactions.down,
    name: '20260828_122519_add_transactions',
  },
  {
    up: migration_20260901_135340_add_location_destination_taxonomy.up,
    down: migration_20260901_135340_add_location_destination_taxonomy.down,
    name: '20260901_135340_add_location_destination_taxonomy',
  },
  {
    up: migration_20260901_150028_media_text_id.up,
    down: migration_20260901_150028_media_text_id.down,
    name: '20260901_150028_media_text_id',
  },
  {
    up: migration_20260901_190820_add_location_content_sections.up,
    down: migration_20260901_190820_add_location_content_sections.down,
    name: '20260901_190820_add_location_content_sections',
  },
]
