import { Calendar, MapPin, Verified, Briefcase, PenBox } from 'lucide-react';
import React from 'react';
import moment from 'moment';

const UserProfileInfo = ({ user, posts, profileId, setShowEdit }) => {
  return (
    <div className='relative py-4 px-6 md:px-8 bg-white'>
      <div className='flex flex-col md:flex-row items-start gap-6'>
        
        {/* Profile Picture */}
        <div className='w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full overflow-hidden'>
          <img
            src={user.profile_picture}
            alt='Profile'
            className='w-full h-full object-cover rounded-full'
          />
        </div>

        {/* Profile Info */}
        <div className='w-full pt-16 md:pt-0 md:pl-36'>
          <div className='flex flex-col md:flex-row items-start justify-between'>

            {/* Name & Username */}
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold text-gray-900'>{user.full_name}</h1>
                {user.is_verified && <Verified className='w-6 h-6 text-blue-500' />}
              </div>
              <p className='text-gray-600'>
                {user.username ? `@${user.username}` : 'Add a username'}
              </p>
            </div>

            {/* Edit Button (Only for own profile) */}
            {!profileId && (
              <button
                onClick={() => setShowEdit(true)}
                className='cursor-pointer flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0'
              >
                <PenBox className='w-4 h-4' />
                Edit
              </button>
            )}
          </div>

          {/* Bio */}
          <p className='text-gray-700 text-sm max-w-md mt-4 whitespace-pre-line'>
            {user.bio || 'Add a short bio'}
          </p>

          {/* Additional Info */}
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-4'>
            
            {/* Location */}
            <span className='flex items-center gap-1.5'>
              <MapPin className='w-4 h-4' />
              {user.location || 'Add location'}
            </span>

            {/* Graduation Year */}
            <span className='flex items-center gap-1.5'>
              <Calendar className='w-4 h-4' />
              Graduation Year:
              <span className='font-medium ml-1'>
                {user.graduation_year || 'Add graduation year'}
              </span>
            </span>

            {/* Current Work */}
            <span className='flex items-center gap-1.5'>
              <Briefcase className='w-4 h-4' />
              Works at:
              <span className='font-medium ml-1'>
                {user.current_work || 'Add workplace'}
              </span>
            </span>
          </div>
        
        <div className='flex items-center gap-6 mt-6 border-t border-gray-200 pt-4'>
            <div>
                <span className='sm:text-xl font-bold text-gray-900'>
                {posts.length}
                </span>
                <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Posts</span>
            </div>
            <div>
                <span className='sm:text-xl font-bold text-gray-900'>
                {user.followers.length}
                </span>
                <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Followers</span>
            </div>
            <div>
                <span className='sm:text-xl font-bold text-gray-900'>
                {user.following.length}
                </span>
                <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Following</span>
            </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;
