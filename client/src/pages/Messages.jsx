import React, { useState, useEffect } from 'react'
import { Eye, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'

const Messages = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await getToken()
        const { data } = await api.get('/api/user/recent-message', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          // Get unique users from messages
          const uniqueUsers = new Map()
          data.messages.forEach((msg) => {
            const userId = msg.from_user_id._id || msg.from_user_id
            if (!uniqueUsers.has(userId)) {
              uniqueUsers.set(userId, msg.from_user_id)
            }
          })
          setMessages(Array.from(uniqueUsers.values()))
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        toast.error('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [getToken])

  if (loading) return <Loading />

  return (
    <div className='min-h-screen relative bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'> 💬Messages </h1>
          <p className='text-slate-600'>Messages from Contacts</p>
        </div>

        {/* Connected Users */}
        <div className='flex flex-col gap-3'>
          {messages.length > 0 ? (
            messages.map((user) => (
              <div key={user._id || user} className='max-w-xl flex flex-wrap gap-5 p-6 bg-white shadow rounded-md'>
                <img
                  src={user.profile_picture || '/default-avatar.png'}
                  alt=""
                  className='rounded-full size-12 mx-auto'
                />
                <div className='flex-1'>
                  <p className='font-medium text-slate-700'>{user.full_name || 'Unknown User'}</p>
                  <p className='text-slate-500'>@{user.username || 'unknown'}</p>
                  <p className='text-sm text-gray-600'>{user.bio || ''}</p>
                </div>

                <div className='flex flex-col gap-2 mt-4'>
                  <button
                    onClick={() => navigate(`/messages/${user._id || user}`)}
                    className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer gap-1'
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(`/profile/${user._id || user}`)}
                    className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer'
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className='text-slate-500 italic'>No messages yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages