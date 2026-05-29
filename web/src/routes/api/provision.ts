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

          if (!PROVISIONER_SECRET) {
            return new Response(
              JSON.stringify({ message: 'Provisioner secret not configured' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Fetch user details for telegram_username fallback
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          })
          const telegramUsername = user?.name || user?.email || 'user'

          // ── Phase 1: Bot + LiteLLM key ──────────────────────────────
          const phase1Res = await fetch(`${WORKER_URL}/provision`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({
              telegram_user_id: userId,
              telegram_username: telegramUsername,
              agent_name: agentName.trim(),
              student_name: studentName.trim(),
              bio,
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

          // ── Phase 2: Docker container ───────────────────────────────
          const phase2Res = await fetch(`${WORKER_URL}/provision/phase2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-secret': PROVISIONER_SECRET,
            },
            body: JSON.stringify({
              telegram_user_id: userId,
            }),
          })

          let containerRunning = false
          if (!phase2Res.ok) {
            // Phase 1 succeeded but Phase 2 failed — still persist the agent
            // so the user sees it and we can retry later
            console.warn('Worker phase 2 failed:', await phase2Res.text().catch(() => 'unknown error'))
          } else {
            containerRunning = true
          }

          // ── Persist in Prisma ──────────────────────────────────────
          const agent = await prisma.agent.create({
            data: {
              userId,
              name: agentName.trim(),
              studentName: studentName.trim(),
              bio,
              containerName: phase1Data.container_name || `student-pa-${agentName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`,
              botUsername: phase1Data.bot_username || null,
              botToken: phase1Data.bot_token || null,
              litellmKey: phase1Data.litellm_key || null,
              status: containerRunning ? 'RUNNING' : 'ERROR',
              containerRunning,
            },
          })

          return new Response(
            JSON.stringify({ success: true, agent: { id: agent.id, name: agent.name, status: agent.status, containerRunning: agent.containerRunning } }),
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
