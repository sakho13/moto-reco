/**
 * ローカル開発用: Firebase Emulator + DB に管理者ユーザーを作成するスクリプト
 *
 * 実行方法:
 *   cd packages/database
 *   dotenv -e .env.local -- tsx prisma/createAdminUser.ts <email> <password>
 *   dotenv -e .env.local -- tsx prisma/createAdminUser.ts --google <email>
 *
 * `--google` 指定時は Emulator 上に Google 認証のユーザーを作成する。
 * 作成したユーザーは Emulator のダミー Google ログイン画面で同じメールアドレスを選ぶとログインできる。
 */

import { prisma } from '../src/index'

const EMULATOR_URL = process.env.FIREBASE_AUTH_EMULATOR_HOST
  ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
  : 'http://localhost:9099'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'motoreco'

async function createFirebaseUser(
  email: string,
  password: string
): Promise<string> {
  const url = `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firebase user creation failed: ${body}`)
  }
  const data = (await res.json()) as { localId: string }
  return data.localId
}

async function createFirebaseGoogleUser(email: string): Promise<string> {
  const url = `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=test`
  const idToken = JSON.stringify({
    sub: `google-${Date.now()}`,
    email,
    email_verified: true,
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `id_token=${idToken}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnSecureToken: true,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firebase Google user creation failed: ${body}`)
  }
  const data = (await res.json()) as { localId: string }
  return data.localId
}

const USAGE = [
  'Usage:',
  '  tsx prisma/createAdminUser.ts <email> <password>',
  '  tsx prisma/createAdminUser.ts --google <email>',
].join('\n')

async function main() {
  const isGoogle = process.argv[2] === '--google'
  const email = isGoogle ? process.argv[3] : process.argv[2]
  const password = isGoogle ? undefined : process.argv[3]

  if (!email || (!isGoogle && !password)) {
    console.error(USAGE)
    process.exit(1)
  }

  console.log(`Firebase Emulator: ${EMULATOR_URL}`)
  console.log(`Project: ${PROJECT_ID}`)
  console.log(
    `Creating admin user: ${email} (${isGoogle ? 'Google' : 'Email/Password'})`
  )

  const uid = password
    ? await createFirebaseUser(email, password)
    : await createFirebaseGoogleUser(email)
  console.log(`Firebase UID: ${uid}`)

  const user = await prisma.mUser.create({
    data: {
      name: email.split('@')[0] ?? 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      authProviders: {
        create: {
          providerType: isGoogle ? 'FIREBASE_GOOGLE' : 'FIREBASE_EMAIL',
          externalId: uid,
          isActive: true,
        },
      },
    },
  })

  console.log(`DB User created: ${user.id}`)
  console.log('')
  console.log('✅ Admin user created successfully!')
  console.log(`   Email:    ${email}`)
  if (password) console.log(`   Password: ${password}`)
  console.log(`   Provider: ${isGoogle ? 'Google' : 'Email/Password'}`)
  console.log(`   Role:     ADMIN`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
