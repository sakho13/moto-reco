'use client'

import Image from 'next/image'
import { LoginCard } from '@/components/LoginCard'
import { APP_NAME } from '@/lib/statics'
import TopImage1 from '@/public/top_image_1.png'
import { APP_NAME } from '@/lib/statics'

export default function Home() {
  return (
    <main className="w-full grid md:grid-cols-2 grid-cols-1">
      <div className="w-full hidden md:flex flex-col justify-center items-center">
        <div id="top-image-card" className="rounded-2xl p-10 w-[80%]">
          <Image
            src={TopImage1}
            alt="top-image-1"
            sizes="100%"
            className=""
            style={{
              objectFit: 'cover',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              userSelect: 'none',
            }}
          />
        </div>
      </div>

      <div className="w-full flex flex-col justify-center px-10 md:px-20 py-10">
        <div className="mb-10 text-center">
          <h1
            className="cursor-default font-bold select-none"
            style={{
              fontSize: 'var(--font-size-3xl)',
            }}
          >
            {APP_NAME}
          </h1>
        </div>

        <div className="w-full max-w-md mx-auto">
          <LoginCard />
        </div>
      </div>
    </main>
  )
}
