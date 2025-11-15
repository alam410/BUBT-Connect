import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate, Link } from 'react-router-dom'
import MenuItems from './MenuItems'
import { CirclePlus, LogOut } from 'lucide-react'
// 1. Import 'useUser' from Clerk
import { UserButton, useClerk, useUser } from '@clerk/clerk-react'
// 2. We no longer need useSelector
// import { useSelector } from 'react-redux'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate()
  const { signOut } = useClerk()
  
  // 3. Get the user object directly from Clerk's hook
  const { user } = useUser()

  // 5. Create a fallback username from the email if user.username is null
  const username = user?.username || user?.primaryEmailAddress?.emailAddress.split('@')[0] || 'user'

  return (
    <div
      className={`w-60 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between items-center 
        max-sm:absolute top-0 bottom-0 z-20 
        ${sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'} 
        transition-all duration-300 ease-in-out`}
    >
      <div className="w-full">
        <img
          onClick={() => navigate('/')}
          src={assets.logo}
          className="w-24 ml-7 my-2 cursor-pointer"
          alt="logo"
        />
        <hr className="border-gray-300 mb-8" />

        <MenuItems setSidebarOpen={setSidebarOpen} />

        <Link
          to="/create-post"
          className="flex items-center justify-center gap-2 py-2.5 mt-6 mx-6 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-700 hover:to-blue-800 active:scale-95 transition text-white cursor-pointer"
        >
          <CirclePlus className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      <div className='w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between'>
        <div className='flex gap-2 items-center cursor-pointer'>
          <UserButton />
          <div>
            {/* 4. Use the user data from Clerk */}
            <h1 className='text-sm font-medium'>{user?.fullName}</h1>
            {/* 6. Use the new username variable */}
            <p className='text-xs text-gray-500'>@{username}</p>
          </div>
        </div>
        <LogOut onClick={() => signOut(() => navigate('/login'))} className='w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer' />
      </div>
    </div>
  )
}

export default Sidebar

