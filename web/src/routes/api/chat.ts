import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '#/db'
import { auth } from '#/lib/auth'

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

export const Route = createFileRoute('/api/chat')({
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

          const agent = await prisma.agent.findUnique({
            where: { userId },
          })
          if (!agent) {
            return new Response(
              JSON.stringify({ messages: [] }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const messages = await prisma.chatMessage.findMany({
            where: { agentId: agent.id },
            orderBy: { createdAt: 'asc' },
            take: 200,
          })

          return new Response(
            JSON.stringify({
              messages: messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
              })),
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        } catch (error: any) {
          console.error('Chat history error:', error)
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

          const agent = await prisma.agent.findUnique({
            where: { userId },
          })
          if (!agent) {
            return new Response(
              JSON.stringify({ message: 'No agent found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            )
          }
          if (agent.status !== 'RUNNING' || !agent.containerRunning) {
            return new Response(
              JSON.stringify({ message: 'Agent is not running' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
          }
          if (!agent.apiKey) {
            return new Response(
              JSON.stringify({ message: 'Agent API key not configured' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
          }

          const body = await request.json().catch(() => ({}))
          const { messages: clientMessages, stream = true } = body

          if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
            return new Response(
              JSON.stringify({ message: 'Missing messages' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // Persist the latest user message
          const lastUserMessage = [...clientMessages].reverse().find((m: any) => m.role === 'user')
          if (lastUserMessage && typeof lastUserMessage.content === 'string') {
            await prisma.chatMessage.create({
              data: {
                agentId: agent.id,
                role: 'user',
                content: lastUserMessage.content,
              },
            })
          }

          const targetUrl = `http://${agent.containerName}:8642/v1/chat/completions`

          const upstream = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${agent.apiKey}`,
              'X-Hermes-Session-Key': `web:${userId}`,
            },
            body: JSON.stringify({
              model: 'hermes-agent',
              messages: clientMessages,
              stream,
            }),
          })

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => 'Agent error')
            return new Response(
              JSON.stringify({ message: text }),
              { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // For non-streaming, read response, persist assistant msg, then return
          if (!stream) {
            const data = await upstream.json()
            const assistantContent = data.choices?.[0]?.message?.content || ''
            if (assistantContent) {
              await prisma.chatMessage.create({
                data: {
                  agentId: agent.id,
                  role: 'assistant',
                  content: assistantContent,
                },
              })
            }
            return new Response(
              JSON.stringify(data),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          }

          // For streaming, proxy SSE while accumulating content for persistence
          const reader = upstream.body!.getReader()
          const decoder = new TextDecoder()
          let accumulated = ''
          let sseBuffer = ''

          const streamResponse = new ReadableStream({
            async pull(controller) {
              while (true) {
                const { value, done: rd } = await reader.read()
                if (rd) {
                  controller.close()
                  if (accumulated) {
                    try {
                      await prisma.chatMessage.create({
                        data: {
                          agentId: agent.id,
                          role: 'assistant',
                          content: accumulated,
                        },
                      })
                    } catch (e) {
                      console.error('Failed to persist assistant message:', e)
                    }
                  }
                  return
                }
                controller.enqueue(value)

                sseBuffer += decoder.decode(value, { stream: true })
                const lines = sseBuffer.split('\n')
                sseBuffer = lines.pop() ?? '' // keep incomplete line for next chunk
                for (const line of lines) {
                  const trimmed = line.trim()
                  if (!trimmed.startsWith('data:')) continue
                  const jsonStr = trimmed.slice(5).trim()
                  if (jsonStr === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(jsonStr)
                    const delta = parsed.choices?.[0]?.delta?.content
                    if (typeof delta === 'string') {
                      accumulated += delta
                    }
                  } catch {
                    // ignore malformed SSE lines
                  }
                }
              }
            },
            cancel() {
              reader.cancel()
            },
          })

          return new Response(streamResponse, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } catch (error: any) {
          console.error('Chat proxy error:', error)
          return new Response(
            JSON.stringify({ message: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      },
    },
  },
})
