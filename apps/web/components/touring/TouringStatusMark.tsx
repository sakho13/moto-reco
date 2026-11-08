import styles from './TouringStatusMark.module.css'

type Props = {
  status: 'STARTED' | 'COMPLETED'
  size?: 'md' | 'sm'
}

/** ツーリングの状態。完了は押印風の「完走」、進行中はバッジで出す */
export function TouringStatusMark({ status, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? styles.small : ''

  if (status === 'STARTED') {
    return <span className={`${styles.started} ${sizeClass}`}>進行中</span>
  }
  return <span className={`${styles.stamp} ${sizeClass}`}>完走</span>
}
