import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'
import { isAdmin } from '#/lib/roles'

async function getSessionUser(request: Request): Promise<{ id: string; role?: string | null } | null> {
  try {
    // @ts-ignore
    const result = await auth.api.getSession({ headers: request.headers })
    return result?.user ?? null
  } catch {
    return null
  }
}

export const Route = createFileRoute('/api/admin/users')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await getSessionUser(request)
          if (!user || !isAdmin(user.role)) {
            return new Response(
              JSON.stringify({ message: 'Forbidden' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const users = await prisma.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              agent: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          })

          return new Response(
            JSON.stringify({ users }),
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
