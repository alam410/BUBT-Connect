import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { MapPin, MessageCircle, Plus, UserPlus, Check } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { updateUserLocal } from '../features/user/userSlice'

const UserCard = ({user}) => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { getToken } = useAuth()
    const currentUser = useSelector((state)=>state.user.value)
    
    const [isFollowing, setIsFollowing] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [loading, setLoading] = useState(false)

    // Check initial state
    useEffect(() => {
        if (currentUser && user) {
            const userId = user._id || user
            setIsFollowing(currentUser.following?.includes(userId) || false)
            setIsConnected(currentUser.connections?.includes(userId) || false)
            
            // Check if there's a pending connection request
            checkPendingConnection(userId)
        }
    }, [currentUser, user])

    const checkPendingConnection = async (userId) => {
        try {
            const token = await getToken()
            const { data } = await api.get('/api/user/connections', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                const pendingIds = data.pendingConnections?.map(u => u._id || u) || []
                setIsPending(pendingIds.includes(userId))
            }
        } catch (error) {
            console.error('Error checking pending connection:', error)
        }
    }

    const handleFollow = async() => {
        if (!user || loading) return
        
        const userId = user._id || user
        if (isFollowing) {
            // Unfollow
            try {
                setLoading(true)
                const token = await getToken()
                const { data } = await api.post(
                    '/api/user/unfollow',
                    { id: userId },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                
                if (data.success) {
                    setIsFollowing(false)
                    toast.success('Unfollowed successfully')
                    // Update Redux state
                    const updatedFollowing = currentUser.following?.filter(id => id !== userId) || []
                    dispatch(updateUserLocal({ ...currentUser, following: updatedFollowing }))
                } else {
                    toast.error(data.message || 'Failed to unfollow')
                }
            } catch (error) {
                console.error('Unfollow error:', error)
                toast.error(error.response?.data?.message || 'Failed to unfollow')
            } finally {
                setLoading(false)
            }
        } else {
            // Follow
            try {
                setLoading(true)
                const token = await getToken()
                const { data } = await api.post(
                    '/api/user/follow',
                    { id: userId },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                
                if (data.success) {
                    setIsFollowing(true)
                    toast.success('Now following!')
                    // Update Redux state
                    const updatedFollowing = [...(currentUser.following || []), userId]
                    dispatch(updateUserLocal({ ...currentUser, following: updatedFollowing }))
                } else {
                    toast.error(data.message || 'Failed to follow')
                }
            } catch (error) {
                console.error('Follow error:', error)
                toast.error(error.response?.data?.message || 'Failed to follow')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleConnectionRequest = async() => {
        if (!user || loading) return
        
        const userId = user._id || user
        
        // If already connected, navigate to messages
        if (isConnected) {
            navigate(`/messages/${userId}`)
            return
        }
        
        // Send connection request
        try {
            setLoading(true)
            const token = await getToken()
            const { data } = await api.post(
                '/api/user/connect',
                { id: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setIsPending(true)
                toast.success('Connection request sent!')
            } else {
                toast.error(data.message || 'Failed to send connection request')
            }
        } catch (error) {
            console.error('Connection request error:', error)
            toast.error(error.response?.data?.message || 'Failed to send connection request')
        } finally {
            setLoading(false)
        }
    }
    
  // Don't show card for current user
  if (currentUser && (currentUser._id === (user._id || user))) {
    return null
  }

  return (
<div key={user._id || user} className='p-4 pt-6 flex flex-col justify-between w-72 shadow border border-gray-200 rounded-md hover:shadow-lg transition-shadow'>
  <div className='text-center'>
    <img src={user.profile_picture} alt="" className='rounded-full w-16 shadow-md mx-auto' />
    
    <p className='mt-4 font-semibold'>{user.full_name}</p>
    
    {user.username && (
      <p className='text-gray-500 font-light'>@{user.username}</p>
    )}

    {user.bio && (
      <p className='text-gray-600 mt-2 text-center text-sm px-4'>
        {user.bio}
      </p>
    )}
  </div>

  <div className='flex items-center justify-center gap-2 mt-4 text-xs text-gray-600'>
        {user.location && (
            <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
                <MapPin className='w-4 h-4' /> {user.location}
            </div>
        )}
        <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
            <span>{Array.isArray(user.followers) ? user.followers.length : 0}</span> Followers
        </div>
    </div>

    <div className='flex mt-4 gap-2'>
    {/* Follow Button */}
    <button
        onClick={handleFollow}
        disabled={loading || !currentUser || (currentUser._id === (user._id || user))}
        className={`w-full py-2 rounded-md flex justify-center items-center gap-2 active:scale-95 transition cursor-pointer ${
            isFollowing
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {isFollowing ? (
            <>
                <Check className='w-4 h-4' />
                Following
            </>
        ) : (
            <>
                <UserPlus className='w-4 h-4' />
                Follow
            </>
        )}
    </button>

    {/* Connection Request Button / Message Button */}
    <button
        onClick={handleConnectionRequest}
        disabled={loading || !currentUser || (currentUser._id === (user._id || user))}
        className={`flex items-center justify-center w-16 border rounded-md cursor-pointer active:scale-95 transition ${
            isConnected
                ? 'bg-indigo-100 border-indigo-300 text-indigo-600 hover:bg-indigo-200'
                : isPending
                ? 'bg-yellow-100 border-yellow-300 text-yellow-600 hover:bg-yellow-200'
                : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={
            isConnected
                ? 'Message'
                : isPending
                ? 'Connection request pending'
                : 'Send connection request'
        }
    >
        {isConnected ? (
            <MessageCircle className='w-5 h-5' />
        ) : isPending ? (
            <Check className='w-5 h-5' />
        ) : (
            <Plus className='w-5 h-5' />
        )}
    </button>
    </div>


</div>
  )
}

export default UserCard