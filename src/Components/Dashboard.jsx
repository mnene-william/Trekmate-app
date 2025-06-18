// src/Components/Dashboard.jsx (Styled Version)
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

function Dashboard() {
  const { currentUser, loading } = useAuth(); // Get currentUser and loading state

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-gray-700">Loading user data...</p>
      </div>
    );
  }

  // Dashboard will now always render, even if no currentUser.

  return (
    // Main container for the dashboard content
    <div className="min-h-0 min-w-0 flex-1 flex flex-col gap-8 lg:gap-10">

      {/* Top Search Bar (specific to Dashboard, not header) */}
      <div className="flex justify-center p-4 lg:p-0">
        <label className="flex flex-col min-w-[320px] !h-12 max-w-xl flex-1">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div
              className="text-[#60758a] flex border-none bg-[#f0f2f5] items-center justify-center pl-4 rounded-l-lg border-r-0"
              data-icon="MagnifyingGlass"
              data-size="24px"
              data-weight="regular"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </div>
            <input
              placeholder="Where to?"
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-full placeholder:text-[#60758a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
              value=""
              readOnly
            />
          </div>
        </label>
      </div>

      {/* Welcome Message (Dynamic based on login status) */}
      <h2 className="text-[#111418] text-[2rem] font-bold leading-tight tracking-[-0.015em] text-center lg:text-left">
        Welcome, {currentUser ? (currentUser.displayName || currentUser.email) : 'to Wanderlust'}!
      </h2>

      {/* Upcoming Trips Section */}
      <h2 className="text-[#111418] text-2xl font-bold leading-tight tracking-[-0.015em] px-4 lg:px-0">Upcoming trips</h2>
      <div className="w-full flex justify-center">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-4 lg:px-0 max-w-full">
          {/* Trip Card 1 */}
          <div className="relative flex-none w-[280px] md:w-[320px] h-[200px] rounded-xl overflow-hidden shadow-lg snap-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("https://images.unsplash.com/photo-1544362141-8e7c10b2b804?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
            <div className="relative p-4 text-white flex flex-col justify-end h-full">
              <p className="text-lg font-bold">Hiking in the Alps</p>
              <p className="text-sm">Join me for a week-long hike in the Swiss Alps</p>
              {/* Conditional button for interaction */}
              {/* {currentUser ? <button className="mt-2 px-3 py-1 bg-blue-500 rounded text-white">Join Trip</button> : <button onClick={() => navigate('/login')} className="mt-2 px-3 py-1 bg-gray-500 rounded text-white">Login to Join</button>} */}
            </div>
          </div>
          {/* Trip Card 2 */}
          <div className="relative flex-none w-[280px] md:w-[320px] h-[200px] rounded-xl overflow-hidden shadow-lg snap-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("https://images.unsplash.com/photo-1549468972-e56598c4146a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
            <div className="relative p-4 text-white flex flex-col justify-end h-full">
              <p className="text-lg font-bold">Relaxing in Bali</p>
              <p className="text-sm">Looking for a travel buddy to enjoy the beaches of Bali</p>
            </div>
          </div>
          {/* Trip Card 3 */}
          <div className="relative flex-none w-[280px] md:w-[320px] h-[200px] rounded-xl overflow-hidden shadow-lg snap-center">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("https://images.unsplash.com/photo-1545639145-c15ae4c062c3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
            <div className="relative p-4 text-white flex flex-col justify-end h-full">
              <p className="text-lg font-bold">Exploring Tokyo</p>
              <p className="text-sm">Discover the vibrant city of Tokyo with me</p>
            </div>
          </div>
          {/* Add more cards here if needed */}
        </div>
      </div>

      {/* Find a Travel Buddy Section */}
      <h2 className="text-[#111418] text-2xl font-bold leading-tight tracking-[-0.015em] px-4 lg:px-0">Find a travel buddy</h2>
      <div className="w-full flex justify-center">
        {/* Category Tabs */}
        <div className="flex gap-2 p-1 bg-[#f0f2f5] rounded-lg">
          <Link to="#" className="flex-1 text-center py-2 px-4 rounded-lg text-[#111418] text-sm font-medium hover:bg-white transition-colors">
            <p>All</p>
          </Link>
          <Link to="#" className="flex-1 text-center py-2 px-4 rounded-lg text-[#111418] text-sm font-medium hover:bg-white transition-colors">
            <p>Europe</p>
          </Link>
          <Link to="#" className="flex-1 text-center py-2 px-4 rounded-lg text-[#111418] text-sm font-medium hover:bg-white transition-colors">
            <p>Asia</p>
          </Link>
          {/* Add more categories if needed */}
        </div>
      </div>
      {/* Travel Buddy Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 lg:px-0">
        {/* Buddy Card 1 */}
        <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("https://randomuser.me/api/portraits/women/1.jpg")` }}
            ></div>
          </div>
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Sarah, 28</p>
          <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Hiking in the Alps</p>
          {/* Conditional button for interaction */}
          {/* {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-gray-500 rounded text-white text-sm">Login to Connect</button>} */}
        </div>
        {/* Buddy Card 2 */}
        <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("https://randomuser.me/api/portraits/men/2.jpg")` }}
            ></div>
          </div>
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Mark, 32</p>
          <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Relaxing in Bali</p>
        </div>
        {/* Buddy Card 3 */}
        <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("https://randomuser.me/api/portraits/women/3.jpg")` }}
            ></div>
          </div>
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Emily, 25</p>
          <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Exploring Tokyo</p>
        </div>
        {/* Buddy Card 4 */}
        <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("https://randomuser.me/api/portraits/men/4.jpg")` }}
            ></div>
          </div>
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">David, 30</p>
          <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Hiking in the Alps</p>
        </div>
        {/* Buddy Card 5 */}
        <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("https://randomuser.me/api/portraits/women/5.jpg")` }}
            ></div>
          </div>
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Jessica, 27</p>
          <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Relaxing in Bali</p>
        </div>
        {/* Buddy Card 6 */}
        <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("https://randomuser.me/api/portraits/men/6.jpg")` }}
            ></div>
          </div>
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Ryan, 31</p>
          <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Exploring Tokyo</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;