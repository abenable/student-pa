import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// Minimal auth instance for seeding (no HTTP plugins needed)
const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
})

async function main() {
  console.log('🌱 Seeding admin account...')

  const adminEmail = 'admin@agenthub.local'
  const adminPassword = 'lurex4098'
  const adminName = 'admin'

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log('⚠️ Admin user already exists, updating role to admin...')
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'admin' },
    })
    console.log('✅ Admin role updated')
    return
  }

  // Create user via Better Auth API (handles password hashing)
  const result = await auth.api.signUpEmail({
    body: {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    },
  })

  // Set role to admin
  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: 'admin' },
  })

  console.log('✅ Admin account seeded successfully')
  console.log('   Email:', adminEmail)
  console.log('   Name:', adminName)
  console.log('   Role: admin')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin account:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
