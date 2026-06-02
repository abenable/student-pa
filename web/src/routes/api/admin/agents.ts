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

export const Route = createFileRoute('/api/admin/agents')({
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

          const agents = await prisma.agent.findMany({
            include: {
              user: { select: { id: true, name: true, email: true, createdAt: true } },
            },
            orderBy: { createdAt: 'desc' },
          })

          const totalUsers = await prisma.user.count()
          const totalAgents = agents.length
          const activeContainers = agents.filter((a) => a.containerRunning).length

          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const servicesRunToday = await prisma.serviceRun.count({
            where: { createdAt: { gte: today } },
          })

          return new Response(
            JSON.stringify({
              agents: agents.map((agent) => ({
                id: agent.id,
                name: agent.name,
                studentName: agent.studentName,
                bio: agent.bio,
                status: agent.status,
                containerName: agent.containerName,
                containerRunning: agent.containerRunning,
                botUsername: agent.botUsername,
                hasBotToken: !!agent.botToken,
                hasLiteLLMKey: !!agent.litellmKey,
                approvedAt: agent.approvedAt,
                approvedBy: agent.approvedBy,
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
                user: agent.user,
              })),
              stats: {
                totalUsers,
                totalAgents,
                activeContainers,
                servicesRunToday,
              },
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
