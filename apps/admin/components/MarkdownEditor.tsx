'use client'

import { Input, Tabs } from 'antd'
import { MarkdownContent } from '@repo/markdown'
import styles from './MarkdownEditor.module.css'

type Props = {
  value?: string
  onChange?: (value: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
}

export function MarkdownEditor({
  value,
  onChange,
  rows = 6,
  placeholder,
  maxLength,
}: Props) {
  return (
    <Tabs
      size="small"
      items={[
        {
          key: 'edit',
          label: '編集',
          children: (
            <Input.TextArea
              rows={rows}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
            />
          ),
        },
        {
          key: 'preview',
          label: 'プレビュー',
          children: (
            <div className={styles.previewBox} style={{ minHeight: rows * 22 }}>
              {value ? (
                <MarkdownContent className={styles.preview}>
                  {value}
                </MarkdownContent>
              ) : (
                <span className={styles.previewEmpty}>
                  プレビューする内容がありません
                </span>
              )}
            </div>
          ),
        },
      ]}
    />
  )
}
