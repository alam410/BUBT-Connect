import React, { useState, useEffect, use } from 'react'
import { useParams, Link } from 'react-router-dom'
import { dummyPostsData, dummyUserData } from '../assets/assets'
import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard' // ✅ Added import
import moment from 'moment'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import api from '../api/axios' 

const Profile = () => {

  const currentUser = useSelector((state) => state.user.value)
  const { getToken } = useAuth()
  const { profileId } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [showEdit, setShowEdit] = useState(false)
  const [postToDelete, setPostToDelete] = useState(null)

  const fetchUser = async (profileId) => { 
    const token = await getToken()
    try {
      const { data } = await api.post(`/api/user/profiles`, {profileId}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (data.success) {
        setUser(data.profile)
        setPosts(data.posts)
      }
      else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      
    }

  }
const handleProfileUpdate = () => {
    // This function's job is to re-run the fetchUser function
    // to get the fresh data from the server.
    if (profileId){ 
      fetchUser(profileId)
    }
    else {
      fetchUser(currentUser._id)
    }
  }

  const confirmDelete = (postId) => {
    setPostToDelete(postId)
  }

  const handleDeletePost = async () => {
    if (!postToDelete) return
    try {
      const token = await getToken()
      const { data } = await api.delete(`/api/post/${postToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setPosts((prev) => prev.filter((post) => post._id !== postToDelete))
        toast.success('Post deleted successfully!')
      } else {
        toast.error(data.message || 'Failed to delete post')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error deleting post')
    } finally {
      setPostToDelete(null)
    }
  }

  useEffect(() => {
    if (profileId){ 
      fetchUser(profileId)
    }
    else {
      fetchUser(currentUser._id)
    }
  }, [profileId,currentUser])
  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>
          {/* Cover Photo */}
          <div className='h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200'>
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                alt=''
                className='w-full h-full object-cover'
              />
            )}
          </div>

          {/* User Info */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        {/* Tabs */}
        <div className='mt-6'>
          <div className=' bg-white rounded-xl shadow p-1 flex max-w-md mx-auto'>
            {['posts', 'media', 'likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className='mt-6 flex flex-col items-center gap-6'>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    currentUser={currentUser}
                    onDelete={() => confirmDelete(post._id)}
                  />
                ))
              ) : (
                <p className='text-gray-500 text-sm'>No posts yet.</p>
              )}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className='flex flex-wrap gap-4 mt-6 justify-center'>
              {posts
                .filter((post) => post.image_urls && post.image_urls.length > 0)
                .map((post) => (
                  <React.Fragment key={post._id}>
                    {post.image_urls.map((image, index) => (
                      <Link
                        target='_blank'
                        to={image}
                        key={index}
                        className='relative group'
                      >
                        <img
                          src={image}
                          alt=''
                          className='w-64 aspect-video object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300'
                        />
                        <p className='absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300'>
                          Posted {moment(post.createdAt).fromNow()}
                        </p>
                      </Link>
                    ))}
                  </React.Fragment>
                ))}
            </div>
          )}

          {/* Likes Tab */}
          {activeTab === 'likes' && (
            <p className='text-center text-gray-500 text-sm mt-6'>
              No liked posts yet.
            </p>
          )}
        </div>
      </div>
          {/* Show Profile Edit */}
    {showEdit && <ProfileModal setShowEdit={setShowEdit} onProfileUpdate={handleProfileUpdate} />}
    
    {/* Delete Confirmation Modal */}
    {postToDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Delete Post?
          </h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              onClick={() => setPostToDelete(null)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              onClick={handleDeletePost}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  ) : (
    <Loading />
  )
}

export default Profile
