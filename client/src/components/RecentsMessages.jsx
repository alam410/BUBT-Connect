import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const RecentsMessages = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()
  const { user } = useUser()

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken()
      const { data } = await api.get('/api/user/recent-message', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setMessages(data.messages || [])
      } else {
        toast.error(data.message || 'Failed to load recent messages')
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error)
      // Don't show toast for this component to avoid spam
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentMessages()
  }, [getToken])

  // helper to safely get nested / variant fields
  const getText = (m) => {
    if (m?.message_type === 'image') return '📷 Image'
    if (m?.message_type === 'video') return '🎥 Video'
    if (m?.message_type === 'audio') return '🎤 Voice message'
    return m?.text ?? m?.message ?? m?.last_message ?? m?.preview ?? 'Media'
  }

  const getCreatedAt = (m) =>
    m?.createdAt ?? m?.created_at ?? m?.timestamp ?? m?.time ?? null

  const getUnreadCount = (m) => {
    // Use the unreadCount from backend if available
    if (typeof m?.unreadCount === 'number') {
      return m.unreadCount
    }
    
    // Fallback: check if this specific message is unread
    // Only count messages received by current user (not sent by current user)
    const currentUserId = user?.id
    const messageFromUserId = m?.originalFromUserId || m?.from_user_id?._id || m?.from_user_id
    const messageToUserId = m?.originalToUserId || m?.to_user_id?._id || m?.to_user_id
    
    // If message was sent by current user, it's always "seen" (no unread count)
    if (currentUserId && String(messageFromUserId) === String(currentUserId)) {
      return 0
    }
    
    // If message was received by current user and not seen, count it
    if (currentUserId && String(messageToUserId) === String(currentUserId)) {
      if (m?.isUnread === true || (typeof m?.seen === 'boolean' && !m.seen)) {
        return 1
      }
    }
    
    return 0
  }

  const getSenderName = (m) =>
    m?.from_user_id?.full_name ??
    m?.from_user_id?.name ??
    m?.from_user_id?.username ??
    m?.from_user_id?.displayName ??
    'Unknown'

  const getProfilePic = (m) =>
    m?.from_user_id?.profile_picture ??
    m?.from_user_id?.avatar ??
    'https://via.placeholder.com/40?text=U'

  return (
    <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-xl shadow text-xs text-slate-800'>
      <h3 className='font-semibold text-slate-800 mb-3 text-sm'>Recent Messages</h3>

      <div className='flex flex-col max-h-56 overflow-y-auto no-scrollbar divide-y divide-slate-100'>
        {loading ? (
          <p className='text-slate-500 text-[13px] p-2'>Loading...</p>
        ) : messages.length === 0 ? (
          <p className='text-slate-500 text-[13px] p-2'>No recent messages</p>
        ) : (
          messages.map((msg, index) => {
            const name = getSenderName(msg)
            const text = getText(msg)
            const createdAt = getCreatedAt(msg)
            const unreadCount = getUnreadCount(msg)
            const profilePic = getProfilePic(msg)
            const userId = msg?.from_user_id?._id ?? msg?.conversation_partner?._id ?? index

            return (
              <Link
                key={msg._id || index}
                to={`/messages/${userId}`}
                className='flex items-start gap-3 py-3 px-1 hover:bg-indigo-50 rounded-md transition-all duration-150'
              >
                <img
                  src={profilePic}
                  alt={name}
                  className='w-9 h-9 rounded-full border border-slate-200 object-cover flex-shrink-0'
                />

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <p className='font-medium text-slate-700 text-sm truncate'>{name}</p>
                    <p className='text-[11px] text-slate-400 ml-2 whitespace-nowrap'>
                      {createdAt ? moment(createdAt).fromNow() : ''}
                    </p>
                  </div>

                  <div className='flex items-center justify-between mt-1'>
                    <p className='text-slate-500 text-[13px] truncate'>
                      {text}
                    </p>

                    {unreadCount > 0 && (
                      <span className='bg-indigo-500 text-white min-w-5 h-5 flex items-center justify-center rounded-full text-[11px] ml-2 flex-shrink-0 px-1.5'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default RecentsMessages
