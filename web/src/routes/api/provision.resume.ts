import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

const WORKER_URL = process.env.WORKER_URL || 'http://worker:8000'
const PROVISIONER_SECRET = process.env.PROVISIONER_SECRET
const JSON_HEADERS = { 'Content-Type': 'application/json' }

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

function redactWorkerStatus(status: any) {
  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return status
  }

  const { bot_token, litellm_key, botToken, litellmKey, ...redacted } = status
  return redacted
}

function getWorkerTelegramUserId(value: bigint | null | undefined): string | null {
  if (!value) {
    return null
  }

  const numericValue = Number(value)
  return Number.isSafeInteger(numericValue) && numericValue > 0 ? value.toString() : null
}

export const Route = createFileRoute('/api/provision/resume')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: JSON_HEADERS }
            )
          }

          const agent = await prisma.agent.findUnique({ where: { userId } })
          if (!agent) {
            return new Response(
              JSON.stringify({ message: 'No agent found' }),
              { status: 404, headers: JSON_HEADERS }
            )
          }

          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: JSON_HEADERS }
            )
          }

          const telegramUserId = getWorkerTelegramUserId(agent.telegramUserId)
          if (!telegramUserId) {
            return new Response(
              JSON.stringify({ message: 'A valid numeric Telegram user ID is required before provisioning can resume' }),
              { status: 400, headers: JSON_HEADERS }
            )
          }

          const res = await fetch(`${WORKER_URL}/provision/resume`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({ telegram_user_id: telegramUserId }),
          })

          if (!res.ok) {
            const text = await res.text().catch(() => 'Worker resume failed')
            // Update DB with the error state if we can
            await prisma.agent.update({
              where: { userId },
              data: {
                status: 'ERROR',
                provisioningStep: text.slice(0, 200),
                containerRunning: false,
              },
            })
            return new Response(
              JSON.stringify({ message: text }),
              { status: res.status, headers: JSON_HEADERS }
            )
          }

          const data = await res.json()
          const isReady = data.provisioning_status === 'ready' && data.container_running

          const updated = await prisma.agent.update({
            where: { userId },
            data: {
              botUsername: data.bot_username || agent.botUsername,
              botToken: data.bot_token || agent.botToken,
              litellmKey: data.litellm_key || agent.litellmKey,
              status: isReady ? 'RUNNING' : 'PROVISIONING',
              provisioningStep: data.provisioning_status || agent.provisioningStep,
              containerRunning: isReady,
            },
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
              success: true,
              agent: serializeUserAgent(updated),
              workerStatus: redactWorkerStatus(data),
            }),
            { status: 200, headers: JSON_HEADERS }
          )
        } catch (error: any) {
          console.error('Provision resume error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: JSON_HEADERS }
          )
        }
      },
    },
  },
})
