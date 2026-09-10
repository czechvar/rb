import { Suspense } from 'react'
import { getUpcomingCatalogueResults } from '@/lib/queries'
import { BlockHeader } from './CatalogueCards'
import { CatalogueResultsClient } from './CatalogueResultsClient'
import { catalogueFacetKeys, type CatalogueFacetKey, type CatalogueSort } from '@/lib/catalogue-results'
import sharedStyles from './blocks.module.css'
import styles from './catalogue-results.module.css'

type CatalogueResultsBlockProps = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  enabledFacets?: CatalogueFacetKey[] | null
  defaultSort?: CatalogueSort | null
  resultLimit?: number | null
  paginationMode?: 'showMore' | 'all' | null
  presentation?: 'calendar' | 'compact' | null
  stickyFilters?: boolean | null
}

export async function CatalogueResultsBlock(block: CatalogueResultsBlockProps) {
  const results = await getUpcomingCatalogueResults()

  return (
    <section className={styles.section}>
      <div className={sharedStyles.sectionInner}>
        <BlockHeader eyebrow={block.eyebrow} heading={block.heading} intro={block.intro} />
        <Suspense fallback={null}>
          <CatalogueResultsClient
            results={results}
            enabledFacets={block.enabledFacets?.filter(isFacet) ?? [...catalogueFacetKeys]}
            defaultSort={block.defaultSort ?? 'date'}
            resultLimit={block.resultLimit ?? 12}
            paginationMode={block.paginationMode ?? 'showMore'}
            presentation={block.presentation ?? 'calendar'}
            stickyFilters={block.stickyFilters ?? false}
          />
        </Suspense>
      </div>
    </section>
  )
}

function isFacet(value: string): value is CatalogueFacetKey {
  return catalogueFacetKeys.includes(value as CatalogueFacetKey)
}
