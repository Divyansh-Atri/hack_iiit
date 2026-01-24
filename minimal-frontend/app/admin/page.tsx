'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Class {
  classId: string
  name: string
  instructor: string
}

interface Session {
  sessionId: string
  title: string
  joinCode: string
  status: string
  createdAt: any
}

export default function AdminPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateClass, setShowCreateClass] = useState(false)
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')

  const [newClass, setNewClass] = useState({ name: '', instructor: '' })
  const [newSession, setNewSession] = useState({ title: '', createdBy: 'admin' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const [classesRes, sessionsRes] = await Promise.all([
        fetch(`${apiUrl}/api/classes`),
        fetch(`${apiUrl}/api/sessions`),
      ])

      const classesData = await classesRes.json()
      const sessionsData = await sessionsRes.json()

      setClasses(classesData)
      setSessions(sessionsData)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/classes/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      })

      if (response.ok) {
        setNewClass({ name: '', instructor: '' })
        setShowCreateClass(false)
        fetchData()
      }
    } catch (err) {
      console.error('Error creating class:', err)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSession,
          classId: selectedClassId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewSession({ title: '', createdBy: 'admin' })
        setShowCreateSession(false)
        alert(`Session created! Join code: ${data.joinCode}`)
        fetchData()
      }
    } catch (err) {
      console.error('Error creating session:', err)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Home
          </button>
        </div>

        {/* Create Class */}
        <section className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Classes</h2>
            <button
              onClick={() => setShowCreateClass(!showCreateClass)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {showCreateClass ? 'Cancel' : 'Create Class'}
            </button>
          </div>

          {showCreateClass && (
            <form onSubmit={handleCreateClass} className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Class Name"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="px-4 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Instructor"
                  value={newClass.instructor}
                  onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                  className="px-4 py-2 border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create
              </button>
            </form>
          )}

          <div className="space-y-2">
            {classes.map((cls) => (
              <div key={cls.classId} className="p-4 border rounded">
                <h3 className="font-semibold">{cls.name}</h3>
                <p className="text-sm text-gray-600">Instructor: {cls.instructor}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Create Session */}
        <section className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Sessions</h2>
            <button
              onClick={() => setShowCreateSession(!showCreateSession)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showCreateSession ? 'Cancel' : 'Create Session'}
            </button>
          </div>

          {showCreateSession && (
            <form onSubmit={handleCreateSession} className="mb-4 p-4 bg-gray-50 rounded">
              <div className="space-y-4">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Session Title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Session
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.sessionId} className="p-4 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{session.title}</h3>
                    <p className="text-sm text-gray-600">
                      Join Code: <span className="font-mono font-bold">{session.joinCode}</span>
                    </p>
                    <p className="text-sm text-gray-600">Status: {session.status}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/s/${session.sessionId}?joinCode=${session.joinCode}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
