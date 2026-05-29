import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function getSessionUserId(request: Request): Promise<string | null> {
  try {
    // @ts-ignore
    const result = await auth.api.getSession({
      headers: request.headers,
    })
    return result?.user?.id ?? null
  } catch {
    return null
  }
}

export const Route = createFileRoute('/api/referral')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              referralCode: true,
              referralCount: true,
              freeWeeksEarned: true,
            },
          })

          if (!user) {
            return new Response(
              JSON.stringify({ message: 'User not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Generate referral code if not exists
          let referralCode = user.referralCode
          if (!referralCode) {
            let attempts = 0
            while (!referralCode && attempts < 10) {
              const code = generateReferralCode()
              const existing = await prisma.user.findUnique({
                where: { referralCode: code },
              })
              if (!existing) {
                referralCode = code
                await prisma.user.update({
                  where: { id: userId },
                  data: { referralCode: code },
                })
              }
              attempts++
            }
          }

          return new Response(
            JSON.stringify({
              referralCode,
              referralCount: user.referralCount,
              freeWeeksEarned: user.freeWeeksEarned,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },

      POST: async ({ request }) => {
        try {
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const body = await request.json()
          const { code } = body

          if (!code || typeof code !== 'string') {
            return new Response(
              JSON.stringify({ message: 'Referral code is required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Find referrer by code
          const referrer = await prisma.user.findUnique({
            where: { referralCode: code.toUpperCase() },
          })

          if (!referrer) {
            return new Response(
              JSON.stringify({ message: 'Invalid referral code' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          if (referrer.id === userId) {
            return new Response(
              JSON.stringify({ message: 'Cannot use your own referral code' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Check if already referred
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
          })

          if (currentUser?.referredById) {
            return new Response(
              JSON.stringify({ message: 'You have already used a referral code' }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Apply referral: update both users
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { referredById: referrer.id },
            }),
            prisma.user.update({
              where: { id: referrer.id },
              data: {
                referralCount: { increment: 1 },
                freeWeeksEarned: { increment: 1 },
              },
            }),
          ])

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Referral applied! Your friend earned a free week.',
              referrerName: referrer.name,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})
