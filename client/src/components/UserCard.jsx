import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { MapPin, MessageCircle, Plus, UserPlus, Check, Calendar, Briefcase, GraduationCap, X } from 'lucide-react'
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
                // Check incoming pending connections (where current user is recipient)
                const incomingPendingIds = data.pendingConnections?.map(u => u._id || u) || []
                // Check outgoing pending connections (where current user is sender)
                const outgoingPendingIds = data.sentPendingConnections?.map(u => u._id || u) || []
                
                // Set pending if user is in either list
                setIsPending(incomingPendingIds.includes(userId) || outgoingPendingIds.includes(userId))
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
        
        // If already pending, cancel the request
        if (isPending) {
            try {
                setLoading(true)
                const token = await getToken()
                const { data } = await api.post(
                    '/api/user/cancel-request',
                    { id: userId },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                
                if (data.success) {
                    setIsPending(false)
                    toast.success('Connection request cancelled')
                } else {
                    toast.error(data.message || 'Failed to cancel connection request')
                }
            } catch (error) {
                console.error('Cancel connection request error:', error)
                toast.error(error.response?.data?.message || 'Failed to cancel connection request')
            } finally {
                setLoading(false)
            }
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
            } else if (data.message && data.message.includes('already pending')) {
                // If it says already pending, set pending state
                setIsPending(true)
                toast.info('Connection request is already pending')
            } else {
                toast.error(data.message || 'Failed to send connection request')
            }
        } catch (error) {
            // If error says "already pending", set pending state
            if (error.response?.data?.message?.includes('already pending')) {
                setIsPending(true)
                toast.info('Connection request is already pending')
            } else {
                console.error('Connection request error:', error)
                toast.error(error.response?.data?.message || 'Failed to send connection request')
            }
        } finally {
            setLoading(false)
        }
    }
    
  // Don't show card for current user
  if (currentUser && (currentUser._id === (user._id || user))) {
    return null
  }

  // Extract user data
  const userId = user._id || user
  const userName = user.full_name || "Unknown User"
  const userUsername = user.username || "unknown"
  const userProfilePic = user.profile_picture || "/default-avatar.png"
  const userLocation = user.location || ""
  const userGraduationYear = user.graduation_year || null
  const userCurrentWork = user.current_work || ""
  const userDepartment = user.department || ""

  return (
    <div
      key={userId}
      className="w-full max-w-sm flex gap-4 p-5 bg-white shadow-md rounded-lg hover:shadow-xl transition-all duration-200 border border-gray-100"
    >
      <img
        src={userProfilePic}
        alt={userName}
        className="rounded-full w-14 h-14 shadow-sm object-cover flex-shrink-0 border-2 border-gray-100"
      />
      <div className="flex-1 min-w-0">
        <div className="mb-2">
          <p className="font-semibold text-slate-800 text-base leading-tight">{userName}</p>
          <p className="text-slate-500 text-sm mt-0.5">@{userUsername}</p>
        </div>

        {/* Additional Information */}
        <div className="mt-3 space-y-1.5 mb-4">
          {/* Location */}
          {userLocation && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{userLocation}</span>
            </div>
          )}

          {/* Department */}
          {userDepartment && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{userDepartment}</span>
            </div>
          )}

          {/* Graduation Year */}
          {userGraduationYear && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Graduated {userGraduationYear}</span>
            </div>
          )}

          {/* Current Work */}
          {userCurrentWork && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{userCurrentWork}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => navigate(`/profile/${userId}`)}
            className="flex-1 min-w-[100px] px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 text-white shadow-sm hover:shadow-md cursor-pointer"
          >
            View Profile
          </button>

          {/* Follow Button */}
          <button
            onClick={handleFollow}
            disabled={loading || !currentUser || (currentUser._id === userId)}
            className={`flex-1 min-w-[100px] px-3 py-2 text-sm font-medium rounded-lg active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
              isFollowing
                ? 'bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
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
            disabled={loading || !currentUser || (currentUser._id === userId)}
            className={`flex-1 min-w-[100px] px-3 py-2 text-sm font-medium rounded-lg active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
              isConnected
                ? 'bg-white border border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700'
                : isPending
                ? 'bg-white border border-orange-300 hover:border-orange-400 hover:bg-orange-50 text-orange-600'
                : 'bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={
              isConnected
                ? 'Message'
                : isPending
                ? 'Click to cancel connection request'
                : 'Send connection request'
            }
          >
            {isConnected ? (
              <>
                <MessageCircle className='w-4 h-4' />
                Message
              </>
            ) : isPending ? (
              <>
                <X className='w-4 h-4' />
                Cancel
              </>
            ) : (
              <>
                <Plus className='w-4 h-4' />
                Connect
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserCard