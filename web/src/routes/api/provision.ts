import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

const WORKER_URL = process.env.WORKER_URL || 'http://127.0.0.1:8000'
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

export const Route = createFileRoute('/api/provision')({
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
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, onboardingSkipped: true },
          })
          const agent = await prisma.agent.findUnique({
            where: { userId },
          })
          return new Response(
            JSON.stringify({ agent, role: user?.role, onboardingSkipped: user?.onboardingSkipped }),
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
          const userId = await getSessionUserId(request)
          if (!userId) {
            return new Response(
              JSON.stringify({ message: 'Unauthorized' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const body = await request.json()
          const { agentName, studentName, bio } = body

          if (!agentName || !studentName || !bio) {
            return new Response(
              JSON.stringify({ message: 'Missing required fields' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Check if user already has an agent in the database
          const existing = await prisma.agent.findUnique({
            where: { userId },
          })
          if (existing) {
            return new Response(
              JSON.stringify({ message: 'Agent already exists' }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Create agent with PENDING_APPROVAL status — admin must approve before provisioning
          const agent = await prisma.agent.create({
            data: {
              userId,
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
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          console.error('Provision error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})
