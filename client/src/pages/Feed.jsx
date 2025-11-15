import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentsMessages from '../components/RecentsMessages'
import api from '../api/axios.js'
import toast from 'react-hot-toast'
import { useUser, useAuth } from '@clerk/clerk-react'

const Feed = () => {
  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [postToDelete, setPostToDelete] = useState(null) // track which post is being deleted
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchFeeds = async () => {
    try {
      const token = await getToken()
      const { data } = await api.get('/api/post/feed', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) setFeeds(data.posts)
      else toast.error(data.message || 'Failed to fetch posts')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error fetching feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeeds()
  }, [])

  const confirmDelete = (postId) => {
    setPostToDelete(postId) // open modal
  }

  const handleDeletePost = async () => {
    if (!postToDelete) return
    try {
      const token = await getToken()
      const { data } = await api.delete(`/api/post/${postToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setFeeds((prev) => prev.filter((post) => post._id !== postToDelete))
        toast.success('Post deleted successfully!')
      } else {
        toast.error(data.message || 'Failed to delete post')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error deleting post')
    } finally {
      setPostToDelete(null) // close modal
    }
  }

  if (loading) return <Loading />

  return (
    <div className='h-full overflow-x-auto overflow-y-auto py-10 xl:pr-5 flex items-start justify-center xl:gap-8 min-w-max'>
      {/* Left: Feed Section */}
      <div>
        <StoriesBar />
        <div className='p-4 space-y-6'>
          {feeds.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onDelete={() => confirmDelete(post._id)}
            />
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className='max-xl:hidden sticky top-0'>
        <div className='max-w-xs bg-white text-xs p-4 rounded-2xl flex flex-col items-center gap-3 shadow-lg border-2 border-indigo-400 hover:shadow-indigo-300 transition-all duration-300'>
          <h2 className='text-slate-800 font-bold text-base mb-2'>🎉 Upcoming Event</h2>
          <img
            src="https://shorturl.at/bvkq4"
            className='w-full h-40 object-cover rounded-lg border border-indigo-300'
            alt="Event Banner"
          />
          <p className='text-slate-600 font-bold text-center'>
            Don’t miss out! Register before seats run out.
          </p>
          <a
            href="https://forms.gle/YOUR_GOOGLE_FORM_ID"
            target="_blank"
            rel="noopener noreferrer"
            className='mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all duration-300'
          >
            Join<br />Now
          </a>
        </div>

        <RecentsMessages />
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Delete Post?</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeletePost}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed
