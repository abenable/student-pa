import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

const WORKER_URL = process.env.WORKER_URL || 'http://worker:8000'
const PROVISIONER_SECRET = process.env.PROVISIONER_SECRET

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

export const Route = createFileRoute('/api/provision/resume')({
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

          const agent = await prisma.agent.findUnique({ where: { userId } })
          if (!agent) {
            return new Response(
              JSON.stringify({ message: 'No agent found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            )
          }

          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const res = await fetch(`${WORKER_URL}/provision/resume`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({ telegram_user_id: userId }),
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
              { status: res.status, headers: { 'Content-Type': 'application/json' } }
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
          })

          return new Response(
            JSON.stringify({ success: true, agent: updated, workerStatus: data }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          console.error('Provision resume error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})
