import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * shadcn/ui で使用するクラス名結合ユーティリティ
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
