import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'
import { isAdmin } from '#/lib/roles'

const WORKER_URL = process.env.WORKER_URL || 'http://worker:8000'
const PROVISIONER_SECRET = process.env.PROVISIONER_SECRET

async function getSessionUser(request: Request): Promise<{ id: string; role?: string } | null> {
  try {
    // @ts-ignore
    const result = await auth.api.getSession({ headers: request.headers })
    return result?.user ?? null
  } catch {
    return null
  }
}

export const Route = createFileRoute('/api/admin/approvals')({
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

          const pending = await prisma.agent.findMany({
            where: { status: 'PENDING_APPROVAL' },
            include: {
              user: { select: { id: true, name: true, email: true, createdAt: true } },
            },
            orderBy: { createdAt: 'asc' },
          })

          return new Response(
            JSON.stringify({ pending }),
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
          const user = await getSessionUser(request)
          if (!user || !isAdmin(user.role)) {
            return new Response(
              JSON.stringify({ message: 'Forbidden' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const body = await request.json().catch(() => ({}))
          const { action, agentId } = body

          if (!agentId || !['approve', 'reject'].includes(action)) {
            return new Response(
              JSON.stringify({ message: 'Invalid action or agentId' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: { user: { select: { name: true, email: true } } },
          })

          if (!agent) {
            return new Response(
              JSON.stringify({ message: 'Agent not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            )
          }

          if (action === 'reject') {
            await prisma.agent.delete({ where: { id: agentId } })
            return new Response(
              JSON.stringify({ success: true, message: 'Agent rejected and removed' }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Approve
          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const telegramUsername = agent.user?.name || agent.user?.email || 'user'

          // Phase 1: Bot + LiteLLM key
          const phase1Res = await fetch(`${WORKER_URL}/provision`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({
              telegram_user_id: agent.userId,
              telegram_username: telegramUsername,
              agent_name: agent.name,
              student_name: agent.studentName,
              bio: agent.bio,
            }),
          })

          if (!phase1Res.ok) {
            const errText = await phase1Res.text().catch(() => 'Worker phase 1 failed')
            return new Response(
              JSON.stringify({ message: errText }),
              { status: phase1Res.status, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const phase1Data = await phase1Res.json()

          // Phase 2: Docker container
          const phase2Res = await fetch(`${WORKER_URL}/provision/phase2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({
              telegram_user_id: agent.userId,
            }),
          })

          let containerRunning = false
          if (!phase2Res.ok) {
            console.warn('Worker phase 2 failed:', await phase2Res.text().catch(() => 'unknown error'))
          } else {
            containerRunning = true
          }

          const updated = await prisma.agent.update({
            where: { id: agentId },
            data: {
              botUsername: phase1Data.bot_username || null,
              botToken: phase1Data.bot_token || null,
              litellmKey: phase1Data.litellm_key || null,
              status: containerRunning ? 'RUNNING' : 'ERROR',
              containerRunning,
              approvedAt: new Date(),
              approvedBy: user.id,
            },
          })

          return new Response(
            JSON.stringify({ success: true, agent: updated }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          console.error('Approval error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})
