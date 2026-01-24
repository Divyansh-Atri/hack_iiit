'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Session {
  sessionId: string
  title: string
  status: string
  transcript: {
    fullText: string
    language: string
  } | null
  summary: {
    short: string
    detailed: string
    bulletPoints: string[]
    keyDecisions: string[]
    actionItems: string[]
    topics: Array<{ name: string; description: string }>
    evidence: Array<{ quote: string; context: string }>
  } | null
  segments: Array<{
    startMs: number
    endMs: number
    text: string
  }>
}

export default function SessionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const joinCode = searchParams.get('joinCode')

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [largeText, setLargeText] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [sessionId, joinCode])

  const fetchSession = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}${joinCode ? `?joinCode=${joinCode}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to load session')
      }

      const data = await response.json()
      setSession(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const filteredTranscript = searchQuery
    ? session.transcript?.fullText
        .split('.')
        .filter((sentence) => sentence.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('.')
    : session.transcript?.fullText

  return (
    <div className={`min-h-screen p-8 ${largeText ? 'large-text' : ''}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{session.title}</h1>
            <p className="text-gray-600">
              Status: <span className="font-semibold">{session.status}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLargeText(!largeText)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              {largeText ? 'Normal Text' : 'Large Text'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Home
            </button>
          </div>
        </div>

        {/* Search */}
        {session.transcript && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}

        {/* Summary */}
        {session.summary && (
          <section className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Summary</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Short Summary</h3>
              <p className="whitespace-pre-line">{session.summary.short}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Detailed Summary</h3>
              <p className="whitespace-pre-line">{session.summary.detailed}</p>
            </div>

            {session.summary.bulletPoints.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1">
                  {session.summary.bulletPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {session.summary.topics.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.summary.topics.map((topic, i) => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold">{topic.name}</h4>
                      <p className="text-sm text-gray-600">{topic.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {session.summary.actionItems.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Action Items</h3>
                <ul className="list-disc list-inside space-y-1">
                  {session.summary.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Transcript */}
        {session.transcript && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Transcript</h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{filteredTranscript}</p>
            </div>
            {session.transcript.language && (
              <p className="mt-4 text-sm text-gray-600">
                Language: {session.transcript.language}
              </p>
            )}
          </section>
        )}

        {/* Status Messages */}
        {session.status === 'processing' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Session is being processed. Please check back later.
          </div>
        )}

        {session.status === 'scheduled' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            Session is scheduled. Transcript will be available after processing.
          </div>
        )}

        {!session.transcript && session.status !== 'processing' && session.status !== 'scheduled' && (
          <div className="mt-8 bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded">
            No transcript available yet.
          </div>
        )}
      </div>
    </div>
  )
}
