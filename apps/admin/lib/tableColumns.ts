import type { TableColumnType } from 'antd'

/** 並べ替えを解除せず、降順と昇順を交互に切り替える */
export const DATE_SORT_DIRECTIONS: NonNullable<
  TableColumnType<object>['sortDirections']
> = ['descend', 'ascend', 'descend']

/** 日付のセルを途中で折り返さない */
export const NOWRAP_CELL = () => ({ style: { whiteSpace: 'nowrap' as const } })
