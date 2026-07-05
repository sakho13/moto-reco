'use client'

import { useState } from 'react'
import styles from './tabs.module.css'

/**
 * タブの定義
 */
export type TabItem = {
  /** タブの識別子 */
  id: string
  /** タブのラベル */
  label: string
  /** タブのコンテンツ */
  content: React.ReactNode
}

/**
 * Tabsコンポーネントのプロパティ
 */
export interface TabsProps {
  /** タブの定義リスト */
  tabs: TabItem[]
  /** デフォルトで選択されるタブの id */
  defaultTabId?: string
}

/**
 * Tabsコンポーネント
 *
 * @remarks
 * shadcn/ui スタイルのタブ切り替えコンポーネント。
 */
export function Tabs({ tabs, defaultTabId }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id)

  return (
    <div>
      <div className={styles.list} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.trigger} ${activeId === tab.id ? styles.active : ''}`}
            onClick={() => setActiveId(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeId !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
