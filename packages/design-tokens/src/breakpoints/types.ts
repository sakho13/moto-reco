/**
 * レスポンシブブレークポイント
 */
export type BreakpointName = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * ブレークポイントトークン (px単位)
 */
export type BreakpointTokens = Record<BreakpointName, string>;
