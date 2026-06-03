import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'
import { isAdmin } from '#/lib/roles'

const WORKER_URL = process.env.WORKER_URL || 'http://worker:8000'
const PROVISIONER_SECRET = process.env.PROVISIONER_SECRET
const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function getSessionUser(request: Request): Promise<{ id: string; role?: string | null } | null> {
  try {
    // @ts-ignore
    const result = await auth.api.getSession({ headers: request.headers })
    return result?.user ?? null
  } catch {
    return null
  }
}

function serializeAdminAgent(agent: any) {
  return {
    id: agent.id,
    name: agent.name,
    studentName: agent.studentName,
    bio: agent.bio,
    status: agent.status,
    provisioningStep: agent.provisioningStep,
    containerName: agent.containerName,
    containerRunning: agent.containerRunning,
    botUsername: agent.botUsername,
    hasTelegramUserId: Boolean(agent.telegramUserId),
    hasBotToken: Boolean(agent.botToken),
    hasLiteLLMKey: Boolean(agent.litellmKey),
    approvedAt: agent.approvedAt,
    approvedBy: agent.approvedBy,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    user: agent.user,
  }
}

function getWorkerTelegramUserId(value: bigint | null | undefined): string | null {
  if (!value) {
    return null
  }

  const numericValue = Number(value)
  return Number.isSafeInteger(numericValue) && numericValue > 0 ? value.toString() : null
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
              { status: 403, headers: JSON_HEADERS }
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
            JSON.stringify({ pending: pending.map(serializeAdminAgent) }),
            { status: 200, headers: JSON_HEADERS }
          )
        } catch (error: any) {
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: JSON_HEADERS }
          )
        }
      },

      POST: async ({ request }) => {
        try {
          const user = await getSessionUser(request)
          if (!user || !isAdmin(user.role)) {
            return new Response(
              JSON.stringify({ message: 'Forbidden' }),
              { status: 403, headers: JSON_HEADERS }
            )
          }

          const body = await request.json().catch(() => ({}))
          const { action, agentId } = body

          if (!agentId || !['approve', 'reject'].includes(action)) {
            return new Response(
              JSON.stringify({ message: 'Invalid action or agentId' }),
              { status: 400, headers: JSON_HEADERS }
            )
          }

          const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: { user: { select: { name: true, email: true } } },
          })

          if (!agent) {
            return new Response(
              JSON.stringify({ message: 'Agent not found' }),
              { status: 404, headers: JSON_HEADERS }
            )
          }

          if (action === 'reject') {
            await prisma.agent.delete({ where: { id: agentId } })
            return new Response(
              JSON.stringify({ success: true, message: 'Agent rejected and removed' }),
              { status: 200, headers: JSON_HEADERS }
            )
          }

          // Approve
          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: JSON_HEADERS }
            )
          }

          const telegramUserId = getWorkerTelegramUserId(agent.telegramUserId)
          if (!telegramUserId) {
            return new Response(
              JSON.stringify({ message: 'A valid numeric Telegram user ID is required before provisioning' }),
              { status: 400, headers: JSON_HEADERS }
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
              telegram_user_id: telegramUserId,
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
              { status: phase1Res.status, headers: JSON_HEADERS }
            )
          }

          const phase1Data = await phase1Res.json()

          // Persist phase 1 success immediately so the user can see progress
          await prisma.agent.update({
            where: { id: agentId },
            data: {
              botUsername: phase1Data.bot_username || null,
              botToken: phase1Data.bot_token || null,
              litellmKey: phase1Data.litellm_key || null,
              status: 'PROVISIONING',
              provisioningStep: phase1Data.provisioning_status || 'bot_created',
              containerRunning: false,
              approvedAt: new Date(),
              approvedBy: user.id,
            },
          })

          // Phase 2: Docker container
          const phase2Res = await fetch(`${WORKER_URL}/provision/phase2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({
              telegram_user_id: telegramUserId,
            }),
          })

          let containerRunning = false
          let provisioningStep = phase1Data.provisioning_status || 'bot_created'
          let finalStatus: 'RUNNING' | 'ERROR' | 'PROVISIONING' = 'PROVISIONING'

          if (!phase2Res.ok) {
            console.warn('Worker phase 2 failed:', await phase2Res.text().catch(() => 'unknown error'))
            finalStatus = 'ERROR'
            provisioningStep = 'container_pending'
          } else {
            containerRunning = true
            finalStatus = 'RUNNING'
            provisioningStep = 'ready'
          }

          const updated = await prisma.agent.update({
            where: { id: agentId },
            data: {
              status: finalStatus,
              provisioningStep,
              containerRunning,
            },
            include: {
              user: { select: { id: true, name: true, email: true, createdAt: true } },
            },
          })

          return new Response(
            JSON.stringify({ success: true, agent: serializeAdminAgent(updated) }),
            { status: 200, headers: JSON_HEADERS }
          )
        } catch (error: any) {
          console.error('Approval error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: JSON_HEADERS }
          )
        }
      },
    },
  },
})
