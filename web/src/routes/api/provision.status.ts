import { createFileRoute } from '@tanstack/react-router'
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

export const Route = createFileRoute('/api/provision/status')({
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

          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const res = await fetch(`${WORKER_URL}/provision/status/${userId}`, {
            headers: { 'x-secret': PROVISIONER_SECRET },
          })

          if (!res.ok) {
            const text = await res.text().catch(() => 'Worker error')
            return new Response(
              JSON.stringify({ message: text }),
              { status: res.status, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const workerStatus = await res.json()
          return new Response(
            JSON.stringify(workerStatus),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          console.error('Provision status error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})
