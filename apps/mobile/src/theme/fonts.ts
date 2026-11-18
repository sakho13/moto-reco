import { Platform } from 'react-native'

/**
 * 書体
 *
 * @remarks
 * Web と同じく、見出し・数値に明朝、本文に端末標準のゴシックを当てて
 * 「整備手帳」の語り口を揃える。フォントファイルは同梱せず、端末に標準搭載の
 * 書体を使う（iOS はヒラギノ明朝、Android は標準のセリフ体）。
 * `undefined` は端末の標準書体を使う指定。
 */
export const FONTS = {
  display: Platform.select({
    ios: 'Hiragino Mincho ProN',
    android: 'serif',
    default: undefined,
  }),
  body: undefined,
} as const
