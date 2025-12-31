import { HomeButton } from '@/components/HomeButton'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <HomeButton />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
        {children}
      </div>
    </>
  )
}
