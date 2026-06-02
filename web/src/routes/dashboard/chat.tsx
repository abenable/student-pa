import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useChat } from '#/lib/use-chat'
import { Send, Loader2, Bot, User } from 'lucide-react'

export const Route = createFileRoute('/dashboard/chat')({
  component: ChatPage,
})

function ChatPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#0070d1]/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#0070d1]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Your Agent</h1>
            <p className="text-xs text-foreground/50">
              {isLoading ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
      >
        {messages.length === 0 && (
          <div className="flex flex-col justify-center h-full text-center w-full px-6">
            <div className="h-16 w-16 rounded-2xl bg-[#0070d1]/10 flex items-center justify-center mb-4 mx-auto">
              <Bot className="h-8 w-8 text-[#0070d1]" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Start a conversation
            </h2>
            <p className="text-sm text-foreground/50 mt-1 mx-auto px-4" style={{ maxWidth: '24rem' }}>
              Send a message to your personal agent. It can help with assignments,
              research, coding, and more.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
              msg.role === 'user'
                ? 'bg-foreground/10'
                : 'bg-[#0070d1]/10'
            }`}>
              {msg.role === 'user' ? (
                <User className="h-4 w-4 text-foreground/70" />
              ) : (
                <Bot className="h-4 w-4 text-[#0070d1]" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0070d1] text-white'
                  : 'bg-[#f5f7fa] dark:bg-[#181818] text-foreground'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-[#0070d1]/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-[#0070d1]" />
            </div>
            <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-2xl px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-[#0070d1]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-2 text-sm">
              {error.message || 'Something went wrong. Please try again.'}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 py-4 border-t border-border">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Message your agent..."
            disabled={isLoading}
            className="flex-1 h-11 rounded-full px-5 text-sm bg-white dark:bg-[#121314] border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-[#0070d1] transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="h-11 w-11 rounded-full bg-[#0070d1] text-white flex items-center justify-center hover:bg-[#005bb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
