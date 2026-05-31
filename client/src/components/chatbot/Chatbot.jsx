import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Bot, ChevronDown, Maximize2, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react'
import * as Yup from 'yup'
import { sendChatMessage } from '../../services/chatService'

const CHAT_MESSAGES_KEY = 'localfixr-chat-messages'
const CHAT_SESSION_KEY = 'localfixr-chat-session'

const suggestions = [
  'How do I book a plumber?',
  'How do I register as a provider?',
  'How can I track my booking?',
  'Payment or refund help',
]

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi! I am LocalFixr AI. I can help with bookings, providers, payments, refunds, and service questions. How can I help?',
  createdAt: new Date().toISOString(),
}

const chatSchema = Yup.object({
  message: Yup.string().trim().required('Type a message first.').max(1000, 'Message must be 1000 characters or less.'),
})

const safeJsonParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const createSessionId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `chat_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

const formatTime = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date)
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
          style={{ animationDelay: `${item * 120}ms` }}
        />
      ))}
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${isUser ? 'bg-indigo-600 text-white' : 'border border-white/60 bg-white/90 text-slate-700'}`}>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
        <p className={`mt-1 text-[10px] font-semibold ${isUser ? 'text-indigo-100' : 'text-slate-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([welcomeMessage])
  const panelRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const savedSession = localStorage.getItem(CHAT_SESSION_KEY) || createSessionId()
    const savedMessages = safeJsonParse(localStorage.getItem(CHAT_MESSAGES_KEY), [welcomeMessage])
    setSessionId(savedSession)
    setMessages(savedMessages.length ? savedMessages : [welcomeMessage])
    localStorage.setItem(CHAT_SESSION_KEY, savedSession)
  }, [])

  useEffect(() => {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages.slice(-40)))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!open || !panelRef.current || panelRef.current.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const unread = useMemo(() => !open && messages.length <= 1, [messages.length, open])

  const chatFormik = useFormik({
    initialValues: { message: '' },
    validationSchema: chatSchema,
    onSubmit: (values, { resetForm }) => submitMessage(values.message, resetForm),
  })

  const submitMessage = async (text = chatFormik.values.message, resetForm) => {
    const cleanText = text.trim()
    if (!cleanText || loading) return

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: cleanText,
      createdAt: new Date().toISOString(),
    }

    setMessages((current) => [...current, userMessage])
    resetForm?.()
    if (!resetForm) chatFormik.resetForm()
    setLoading(true)

    try {
      const response = await sendChatMessage({ message: cleanText, sessionId })
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId)
        localStorage.setItem(CHAT_SESSION_KEY, response.sessionId)
      }
      setMessages((current) => [
        ...current,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          text: response.reply,
          createdAt: response.timestamp || new Date().toISOString(),
        },
      ])
    } catch (error) {
      const networkMessage = error.code === 'ERR_NETWORK'
        ? 'LocalFixr AI backend is not running. Please start the server, then try again.'
        : null
      setMessages((current) => [
        ...current,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          text: networkMessage || error.response?.data?.message || 'Sorry, LocalFixr AI is unavailable right now. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    const nextSession = createSessionId()
    setSessionId(nextSession)
    setMessages([welcomeMessage])
    localStorage.setItem(CHAT_SESSION_KEY, nextSession)
  }

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[70]">
      <div
        className={`mb-4 overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-[0_28px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl transition-all duration-300 ${
          open
            ? maximized
              ? 'h-[min(760px,calc(100vh-7rem))] w-[min(92vw,520px)] translate-y-0 opacity-100'
              : 'h-[min(660px,calc(100vh-7rem))] w-[min(92vw,390px)] translate-y-0 opacity-100'
            : 'pointer-events-none h-0 w-[min(92vw,390px)] translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Bot className="h-6 w-6" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-indigo-600 bg-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-black">LocalFixr AI</p>
              <p className="flex items-center gap-1 text-xs text-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Online support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMaximized((current) => !current)}
              className="grid h-9 w-9 place-items-center rounded-xl text-white/90 transition hover:bg-white/15"
              aria-label={maximized ? 'Minimize chatbot' : 'Maximize chatbot'}
            >
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-xl text-white/90 transition hover:bg-white/15"
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100%-76px)] flex-col bg-gradient-to-b from-indigo-50/80 to-white/90">
          <div className="sidebar-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/60 bg-white/90 px-4 py-2 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={loading}
                  onClick={() => submitMessage(suggestion)}
                  className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={chatFormik.handleSubmit}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100"
            >
              <label htmlFor="localfixr-chat-message" className="sr-only">
                Message <span className="text-rose-500">*</span>
              </label>
              <input
                id="localfixr-chat-message"
                name="message"
                value={chatFormik.values.message}
                onChange={chatFormik.handleChange}
                onBlur={chatFormik.handleBlur}
                maxLength={1000}
                placeholder="Ask LocalFixr AI..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={resetChat}
                className="hidden rounded-xl px-2 py-2 text-xs font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 sm:block"
              >
                New
              </button>
              <button
                type="submit"
                disabled={loading || !chatFormik.values.message.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {chatFormik.touched.message && chatFormik.errors.message && (
              <p className="mt-2 text-xs font-semibold text-rose-600">{chatFormik.errors.message}</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group relative ml-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 text-white shadow-[0_18px_45px_rgba(37,99,235,0.42)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(37,99,235,0.52)]"
        aria-label={open ? 'Close LocalFixr AI chatbot' : 'Open LocalFixr AI chatbot'}
      >
        <span className="absolute inset-0 rounded-3xl bg-white/20 opacity-0 blur transition group-hover:opacity-100" />
        {open ? <ChevronDown className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
        <span className="absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-[10px] font-black ring-4 ring-white">
          {unread ? '1' : <Sparkles className="h-3 w-3" />}
        </span>
      </button>
    </div>
  )
}

export default Chatbot
