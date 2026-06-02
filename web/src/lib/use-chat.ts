import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface UseChatOptions {
  api: string
}

interface UseChatReturn {
  messages: ChatMessage[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  error: Error | null
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

export function useChat({ api }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading) return

      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const abort = new AbortController()
      abortRef.current = abort

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text,
      }

      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setInput('')
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            stream: true,
          }),
          signal: abort.signal,
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || `HTTP ${res.status}`)
        }

        if (!res.body) {
          throw new Error('No response body')
        }

        const assistantId = generateId()
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''
        let done = false

        while (!done) {
          const { value, done: rd } = await reader.read()
          done = rd
          if (!value) continue

          sseBuffer += decoder.decode(value, { stream: true })
          const lines = sseBuffer.split('\n')
          sseBuffer = lines.pop() ?? '' // keep incomplete line for next chunk
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const jsonStr = trimmed.slice(5).trim()
            if (jsonStr === '[DONE]') {
              done = true
              break
            }
            try {
              const parsed = JSON.parse(jsonStr)
              const delta = parsed.choices?.[0]?.delta?.content
              if (typeof delta === 'string') {
                setMessages((prev) => {
                  const last = prev[prev.length - 1]
                  if (!last || last.role !== 'assistant') return prev
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + delta,
                  }
                  return updated
                })
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [api, input, isLoading, messages]
  )

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  }
}
