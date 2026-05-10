import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full text-center gap-6 px-6">
      <p className="text-8xl font-thin tracking-tighter leading-none">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        ページが見つかりません
      </h1>
      <p className="text-sm leading-relaxed opacity-60">
        お探しのページは存在しないか、移動された可能性があります。
      </p>
      <Link
        href="/app/home"
        className="inline-flex items-center justify-center px-7 py-3 rounded-full text-sm font-semibold bg-foreground text-background transition-opacity hover:opacity-80"
      >
        ダッシュボードへ戻る
      </Link>
    </div>
  )
}
