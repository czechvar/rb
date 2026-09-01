'use client'

import { useState, type ReactNode } from 'react'

import styles from './page.module.css'

export type WorkbenchTab = {
  id: string
  label: string
  summary: string
  content: ReactNode
}

export function WorkbenchTabs({ tabs }: { tabs: WorkbenchTab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')

  return (
    <div className={styles.tabWorkbench}>
      <div className={styles.tabs} role="tablist" aria-label="Design system panes">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <small>{tab.summary}</small>
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <section
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className={styles.tabPanel}
        >
          {tab.content}
        </section>
      ))}
    </div>
  )
}
