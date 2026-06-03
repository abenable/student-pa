import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

const JSON_HEADERS = { 'Content-Type': 'application/json' }
const MAX_SAFE_TELEGRAM_USER_ID = BigInt(Number.MAX_SAFE_INTEGER)

async function getSessionUserId(request: Request): Promise<string | null> {
  try {
    // @ts-ignore - auth.api.getSession is dynamically typed
    const result = await auth.api.getSession({
      headers: request.headers,
    })
    return result?.user?.id ?? null
  } catch {
    return null
  }
}

function parseTelegramUserId(value: unknown): bigint | null {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value <= 0) {
      return null
    }
    return BigInt(value)
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return null
  }

  const parsed = BigInt(trimmed)
  return parsed <= MAX_SAFE_TELEGRAM_USER_ID ? parsed : null
}

function serializeUserAgent(agent: any) {
  if (!agent) {
    return null
  }

  return {
    id: agent.id,
    name: agent.name,
    studentName: agent.studentName,
    bio: agent.bio,
    status: agent.status,
    provisioningStep: agent.provisioningStep,
    containerRunning: agent.containerRunning,
    botUsername: agent.botUsername,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  }
}

export const Route = createFileRoute('/api/provision')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: JSON_HEADERS }
            )
          }
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, onboardingSkipped: true },
          })
          const agent = await prisma.agent.findUnique({
            where: { userId },
            select: {
              id: true,
              name: true,
              studentName: true,
              bio: true,
              status: true,
              provisioningStep: true,
              containerRunning: true,
              botUsername: true,
              createdAt: true,
              updatedAt: true,
            },
          })
          return new Response(
            JSON.stringify({
              agent: serializeUserAgent(agent),
              role: user?.role,
              onboardingSkipped: user?.onboardingSkipped,
            }),
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
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: JSON_HEADERS }
            )
          }

          const body = await request.json()
          const { agentName, studentName, bio, telegramUserId } = body

          if (!agentName || !studentName || !bio) {
            return new Response(
              JSON.stringify({ message: 'Missing required fields' }),
              { status: 400, headers: JSON_HEADERS }
            )
          }

          const parsedTelegramUserId = parseTelegramUserId(telegramUserId)
          if (!parsedTelegramUserId) {
            return new Response(
              JSON.stringify({ message: 'Telegram user ID must be a positive numeric ID' }),
              { status: 400, headers: JSON_HEADERS }
            )
          }

          // Check if user already has an agent in the database
          const existing = await prisma.agent.findUnique({
            where: { userId },
          })
          if (existing) {
            return new Response(
              JSON.stringify({ message: 'Agent already exists' }),
              { status: 409, headers: JSON_HEADERS }
            )
          }

          // Create agent with PENDING_APPROVAL status — admin must approve before provisioning
          const agent = await prisma.agent.create({
            data: {
              userId,
              telegramUserId: parsedTelegramUserId,
              name: agentName.trim(),
              studentName: studentName.trim(),
              bio,
              containerName: `student-pa-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`,
              status: 'PENDING_APPROVAL',
              containerRunning: false,
            },
          })

          return new Response(
            JSON.stringify({ 
              success: true, 
              pendingApproval: true,
              agent: { id: agent.id, name: agent.name, status: agent.status } 
            }),
            { status: 200, headers: JSON_HEADERS }
          )
        } catch (error: any) {
          console.error('Provision error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: JSON_HEADERS }
          )
        }
      },
    },
  },
})
