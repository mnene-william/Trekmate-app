import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import Header from './Header';

function Dashboard() {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-lg text-gray-700">Loading user data...</p>
            </div>
        );
    }

    return (<>
    <Header />

        <div className="min-h-0 min-w-0 flex-1 flex flex-col gap-8 lg:gap-10 p-4 lg:p-0">

            <h2 className="text-[#111418] text-[2rem] font-bold leading-tight tracking-[-0.015em] text-center lg:text-left">
                Welcome, {currentUser ? (currentUser.displayName || currentUser.email) : 'to Wanderlust'}!
            </h2>

            <h2 className="text-[#111418] text-2xl font-bold leading-tight tracking-[-0.015em] px-4 lg:px-0">Upcoming trips</h2>
            <div className="w-full flex justify-center">
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-4 lg:px-0 max-w-full">
            <div className="flex-none w-[280px] md:w-[320px] rounded-xl overflow-hidden shadow-md snap-center bg-white">
                <div className="w-full h-[160px] md:h-[180px] bg-cover bg-center"
                    style={{ backgroundImage: `url("https://images.unsplash.com/photo-1544362141-8e7c10b2b804?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")` }}>
                </div>
                <div className="p-4">
                    <p className="text-lg font-semibold text-[#111418] mb-1">Hiking in the Alps</p>
                    <p className="text-sm text-[#60758a]">Join me for a week-long hike in the Swiss Alps</p>
                 {currentUser ? <button className="mt-4 w-full bg-[#0c7ff2] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">Join Trip</button> : <button onClick={() => navigate('/login')} className="mt-4 w-full bg-[#0c7ff2] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm font-medium">Join Trip</button>}
                </div>
            </div>
            <div className="flex-none w-[280px] md:w-[320px] rounded-xl overflow-hidden shadow-md snap-center bg-white">
                <div className="w-full h-[160px] md:h-[180px] bg-cover bg-center"
                    style={{ backgroundImage: `url("https://images.unsplash.com/photo-1549468972-e56598c4146a?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")` }}>
                </div>
                <div className="p-4">
                    <p className="text-lg font-semibold text-[#111418] mb-1">Relaxing in Bali</p>
                    <p className="text-sm text-[#60758a]">Looking for a travel buddy to enjoy the beaches of Bali</p>
                    {currentUser ? <button className="mt-4 w-full bg-[#0c7ff2] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">Join Trip</button> : <button onClick={() => navigate('/login')} className="mt-4 w-full bg-[#0c7ff2] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm font-medium">Join Trip</button>}      
                </div>
            </div>
            <div className="flex-none w-[280px] md:w-[320px] rounded-xl overflow-hidden shadow-md snap-center bg-white">
                <div className="w-full h-[160px] md:h-[180px] bg-cover bg-center"
                    style={{ backgroundImage: `url("https://images.unsplash.com/photo-1545639145-c15ae4c062c3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")` }}>
                </div>
                <div className="p-4">
                    <p className="text-lg font-semibold text-[#111418] mb-1">Exploring Tokyo</p>
                    <p className="text-sm text-[#60758a]">Discover the vibrant city of Tokyo with me</p>
                 {currentUser ? <button className="mt-4 w-full bg-[#0c7ff2] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">Join Trip</button> : <button onClick={() => navigate('/login')} className="mt-4 w-full bg-[#0c7ff2] text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm font-medium">Join Trip</button>}
                </div>
            </div>
        </div>
            </div>

            <h2 className="text-[#111418] text-2xl font-bold leading-tight tracking-[-0.015em] px-4 lg:px-0">Find a travel buddy</h2>
            <div className="w-full flex justify-center">
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
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 lg:px-0">
                <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url("https://randomuser.me/api/portraits/women/1.jpg")` }}
                        ></div>
                    </div>
                    <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Sarah, 28</p>
                    <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Hiking in the Alps</p>
                    {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button>}
                </div>
                <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url("https://randomuser.me/api/portraits/men/2.jpg")` }}
                        ></div>
                    </div>
                    <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Mark, 32</p>
                    <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Relaxing in Bali</p>
                     {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button>}
                </div>
                <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url("https://randomuser.me/api/portraits/women/3.jpg")` }}
                        ></div>
                    </div>
                    <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Emily, 25</p>
                    <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Exploring Tokyo</p>
                     {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button>}
                </div>
                <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url("https://randomuser.me/api/portraits/men/4.jpg")` }}
                        ></div>
                    </div>
                    <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">David, 30</p>
                    <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Hiking in the Alps</p>
                    {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button>}
                </div>
                <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url("https://randomuser.me/api/portraits/women/5.jpg")` }}
                        ></div>
                    </div>
                    <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Jessica, 27</p>
                    <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Relaxing in Bali</p>
                    {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button>}
                </div>
                <div className="flex flex-col items-center p-4 border border-[#f0f2f5] rounded-xl bg-white shadow-sm">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url("https://randomuser.me/api/portraits/men/6.jpg")` }}
                        ></div>
                    </div>
                    <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] mb-1">Ryan, 31</p>
                    <p className="text-[#60758a] text-sm leading-normal text-center mb-3">Exploring Tokyo</p>
                    {currentUser ? <button className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Connect</button> : <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-500 rounded text-white text-sm">Login to Connect</button>}
                </div>
            </div>
        </div>
    </>);
}

export default Dashboard;
