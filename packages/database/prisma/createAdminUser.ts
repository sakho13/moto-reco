/**
 * ローカル開発用: Firebase Emulator + DB に管理者ユーザーを作成するスクリプト
 *
 * 実行方法:
 *   cd packages/database
 *   dotenv -e .env.local -- tsx prisma/createAdminUser.ts <email> <password>
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

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: tsx prisma/createAdminUser.ts <email> <password>')
    process.exit(1)
  }

  console.log(`Firebase Emulator: ${EMULATOR_URL}`)
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Creating admin user: ${email}`)

  const uid = await createFirebaseUser(email, password)
  console.log(`Firebase UID: ${uid}`)

  const user = await prisma.mUser.create({
    data: {
      name: email.split('@')[0] ?? 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      authProviders: {
        create: {
          providerType: 'FIREBASE_EMAIL',
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
  console.log(`   Password: ${password}`)
  console.log(`   Role:     ADMIN`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
