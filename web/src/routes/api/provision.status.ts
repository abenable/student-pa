import { createFileRoute } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { prisma } from '#/db'

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

export const Route = createFileRoute('/api/provision/status')({
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

          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: JSON_HEADERS }
            )
          }

          const agent = await prisma.agent.findUnique({
            where: { userId },
            select: { telegramUserId: true },
          })

          if (!agent) {
            return new Response(
              JSON.stringify({ message: 'No agent found' }),
              { status: 404, headers: JSON_HEADERS }
            )
          }

          const telegramUserId = getWorkerTelegramUserId(agent.telegramUserId)
          if (!telegramUserId) {
            return new Response(
              JSON.stringify({ message: 'A valid numeric Telegram user ID is required before provisioning status can be checked' }),
              { status: 400, headers: JSON_HEADERS }
            )
          }

          const res = await fetch(`${WORKER_URL}/provision/status/${telegramUserId}`, {
            headers: { 'x-secret': PROVISIONER_SECRET },
          })

          if (!res.ok) {
            const text = await res.text().catch(() => 'Worker error')
            return new Response(
              JSON.stringify({ message: text }),
              { status: res.status, headers: JSON_HEADERS }
            )
          }

          const workerStatus = await res.json()
          return new Response(
            JSON.stringify(redactWorkerStatus(workerStatus)),
            { status: 200, headers: JSON_HEADERS }
          )
        } catch (error: any) {
          console.error('Provision status error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: JSON_HEADERS }
          )
        }
      },
    },
  },
})
