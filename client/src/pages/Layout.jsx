import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = () => {
  const user = useSelector((state) => state.user.value)
  const userStatus = useSelector((state) => state.user.status)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('Layout - User status:', userStatus, 'User:', !!user)
  }, [user, userStatus])

  // Show loading while user is being fetched
  if (userStatus === 'loading' || (!user && userStatus === 'idle')) {
    return <Loading />
  }

  // If user fetch failed, show error but still try to render
  if (userStatus === 'failed' && !user) {
    console.error('Layout - User fetch failed, showing error UI')
    return (
      <div className='w-full flex h-screen items-center justify-center bg-slate-50'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md'>
          <h2 className='text-xl font-bold text-red-800 mb-2'>Connection Error</h2>
          <p className='text-red-600 mb-4'>
            Unable to load user data. Please check:
          </p>
          <ul className='list-disc list-inside text-red-600 space-y-1 mb-4'>
            <li>Server is running on port 4000</li>
            <li>MongoDB is connected</li>
            <li>You are logged in</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // If no user but status is succeeded, something is wrong
  if (!user && userStatus === 'succeeded') {
    console.warn('Layout - User status succeeded but no user data')
    return <Loading />
  }

  // Render layout if user exists
  if (user) {
    return (
      <div className='w-full flex h-screen relative'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className='fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className='flex-1 bg-slate-50 overflow-auto'>
          {/* Mobile menu button - Left side only */}
          {!sidebarOpen ? (
            <Menu
              className='fixed top-3 left-3 p-2 z-50 bg-white rounded-md shadow-lg w-10 h-10 text-gray-600 md:hidden cursor-pointer'
              style={{ left: '12px', top: '12px', right: 'auto' }}
              onClick={() => setSidebarOpen(true)}
            />
          ) : (
            <X
              className='fixed top-3 left-3 p-2 z-50 bg-white rounded-md shadow-lg w-10 h-10 text-gray-600 md:hidden cursor-pointer'
              style={{ left: '12px', top: '12px', right: 'auto' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Outlet />
        </div>
      </div>
    )
  }

  // Fallback loading
  return <Loading />
}

export default Layout