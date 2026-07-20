'use client'

import { type FormEvent, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import styles from './KeywordSearchBar.module.css'

export interface KeywordSearchBarProps {
  /**
   * 入力欄のプレースホルダー
   */
  placeholder: string
  /**
   * 検索確定時（送信・クリア）のコールバック。
   * 空文字の場合は検索条件なしとして扱う。
   */
  onSearch: (keyword: string) => void
  /**
   * ルートフォームに付与するdata-testid
   */
  testId?: string
}

/**
 * 一覧画面共通のキーワード検索フォーム
 *
 * @remarks
 * 入力中は検索を発火せず、送信（ボタンクリック・Enter）で確定する。
 * 確定済みキーワードがある場合はクリアボタンを表示する。
 */
export const KeywordSearchBar = ({
  placeholder,
  onSearch,
  testId,
}: KeywordSearchBarProps) => {
  const [inputValue, setInputValue] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = inputValue.trim()
    setAppliedKeyword(trimmed)
    onSearch(trimmed)
  }

  const handleClear = () => {
    setInputValue('')
    setAppliedKeyword('')
    onSearch('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} data-testid={testId}>
      <div className={styles.inputWrap}>
        <Input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={placeholder}
        />
      </div>
      <Button type="submit" variant="cloud">
        検索
      </Button>
      {appliedKeyword && (
        <Button type="button" variant="cloud" onClick={handleClear}>
          クリア
        </Button>
      )}
    </form>
  )
}
