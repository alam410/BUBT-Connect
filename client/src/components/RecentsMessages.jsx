import React, { useEffect, useState } from 'react'
import { dummyRecentMessagesData } from '../assets/assets'
import { Link } from 'react-router-dom'
import moment from 'moment'

const RecentsMessages = () => {
  const [messages, setMessages] = useState([])

  const fetchRecentMessages = async () => {
    setMessages(dummyRecentMessagesData || [])
  }

  useEffect(() => {
    fetchRecentMessages()
  }, [])

  // helper to safely get nested / variant fields
  const getText = (m) =>
    m?.text ?? m?.message ?? m?.last_message ?? m?.preview ?? 'Media'

  const getCreatedAt = (m) =>
    m?.createdAt ?? m?.created_at ?? m?.timestamp ?? m?.time ?? null

  const isSeen = (m) => {
    // try several possible flags; default to true if not present
    if (typeof m?.seen === 'boolean') return m.seen
    if (typeof m?.is_read === 'boolean') return m.is_read
    if (typeof m?.read === 'boolean') return m.read
    return true
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
        {messages.length === 0 ? (
          <p className='text-slate-500 text-[13px] p-2'>No recent messages</p>
        ) : (
          messages.map((msg, index) => {
            const name = getSenderName(msg)
            const text = getText(msg)
            const createdAt = getCreatedAt(msg)
            const seen = isSeen(msg)
            const profilePic = getProfilePic(msg)

            return (
              <Link
                key={index}
                to={`/messages/${msg?.from_user_id?._id ?? index}`}
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

                    {!seen && (
                      <span className='bg-indigo-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[11px] ml-2 flex-shrink-0'>
                        1
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
