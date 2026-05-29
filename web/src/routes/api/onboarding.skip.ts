import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

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

export const Route = createFileRoute('/api/onboarding/skip')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          await prisma.user.update({
            where: { id: userId },
            data: { onboardingSkipped: true },
          })

          return new Response(
            JSON.stringify({ success: true }),
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
