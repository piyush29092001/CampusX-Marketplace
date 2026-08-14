import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Profile = () => {
    const navigate = useNavigate();
    const { logout } = useStore();
    const [activeTab, setActiveTab] = useState('OVERVIEW');
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        activeListings: 0,
        totalViews: 0,
        itemsSold: 0,
        recentTransactions: []
    });
    const [myListings, setMyListings] = useState([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Attempt parsing user details safely
    let userName = 'SYSTEM_USER';
    try {
        const tokenPayload = JSON.parse(atob(localStorage.getItem('lumina_token').split('.')[1]));
        userName = tokenPayload.email || 'SYSTEM_USER';
    } catch (e) { }

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('lumina_token');
            if (!token) return navigate('/login');

            // Fetch both overview metrics and listings simultaneously
            const [overviewRes, listingsRes] = await Promise.all([
                fetch('/api/dashboard/overview', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/products/my-listings', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const overviewData = await overviewRes.json();
            const listingsData = await listingsRes.json();

            if (overviewData.success) setDashboardData(overviewData.data);
            if (listingsData.success) setMyListings(listingsData.data);

        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Run once on mount

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('lumina_token');
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMyListings(myListings.filter(item => item._id !== id));
                setDeleteConfirmId(null);
            } else {
                alert(data.error || 'Failed to delete');
            }
        } catch (error) {
            alert('Failed to delete product');
        }
    };

    return (
        <div className="min-h-screen md:h-screen bg-background text-on-background font-body-md flex flex-col md:flex-row md:overflow-hidden md:absolute md:inset-0 md:z-50">
            <aside className="hidden md:flex flex-col h-screen p-gutter bg-surface w-64 border-r border-on-background z-40 shrink-0">
                <div className="mb-8">
                    <h1 className="font-headline-sm text-headline-sm text-on-background cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>CampusX Dash</h1>
                    <p className="font-metadata text-metadata text-on-surface-variant mt-2 truncate">{userName}</p>
                </div>
                <button onClick={() => navigate('/sell')} className="bg-primary text-on-primary font-label-caps py-3 px-4 mb-8 flex justify-between items-center border border-primary hover:bg-on-background transition-all group shadow-hard">
                    NEW_LISTING <span className="bg-on-primary text-primary w-2 h-2 inline-block group-hover:bg-primary"></span>
                </button>
                <nav className="flex-1 flex flex-col gap-unit">
                    <button onClick={() => setActiveTab('OVERVIEW')} className={`${activeTab === 'OVERVIEW' ? 'bg-primary text-on-primary block' : 'text-on-surface-variant hover:bg-surface-container-highest'} font-label-caps text-left w-full px-4 py-3 flex items-center gap-3 transition-colors`}>
                        <span className="material-symbols-outlined">dashboard</span> OVERVIEW
                    </button>
                    <button onClick={() => setActiveTab('MY_LISTINGS')} className={`${activeTab === 'MY_LISTINGS' ? 'bg-primary text-on-primary block' : 'text-on-surface-variant hover:bg-surface-container-highest'} font-label-caps text-left w-full px-4 py-3 flex items-center gap-3 transition-colors`}>
                        <span className="material-symbols-outlined">list_alt</span> MY_LISTINGS
                    </button>
                    <Link className="text-on-surface-variant font-label-caps px-4 py-3 flex items-center gap-3 hover:bg-surface-container-highest transition-colors" to="/messages">
                        <span className="material-symbols-outlined">forum</span> MESSAGES
                    </Link>
                </nav>
                <div className="mt-auto border-t border-outline-variant pt-4 flex flex-col">
                    <button onClick={async () => { await logout(); navigate('/login'); }} className="text-on-surface-variant font-label-caps w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface-container-highest transition-colors">
                        <span className="material-symbols-outlined">logout</span> LOGOUT
                    </button>
                </div>
            </aside>
            <main className="flex-1 md:overflow-y-auto bg-surface-container-low p-4 md:p-12 dotted-grid w-full pb-20 md:pb-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-on-background pb-4 mb-4 md:mb-8 gap-4">
                    <div>
                        <h2 className="font-headline-lg text-[20px] md:text-headline-lg blinking-cursor tracking-tighter uppercase md:normal-case">&gt; {activeTab === 'OVERVIEW' ? 'SYSTEM_OVERVIEW' : 'MY_LISTINGS'}</h2>
                        <p className="font-metadata text-[10px] md:text-metadata text-on-surface-variant mt-1 md:mt-2 uppercase">Runtime Analytics // Live</p>
                    </div>
                    <button onClick={async () => { await logout(); navigate('/login'); }} className="md:hidden border border-error text-error bg-error/10 font-label-caps px-4 py-2 hover:bg-error hover:text-on-error transition-colors w-full text-center">
                        [ LOGOUT ]
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <p className="font-label-caps text-on-surface-variant animate-pulse tracking-widest">LOADING_SYSTEM_DATA...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-gutter">
                            <div className="bg-surface-container-lowest border border-on-background p-3 md:p-6 shadow-[4px_4px_0_0_#17172A] flex flex-col justify-between min-h-[120px] md:min-h-[160px]">
                                <span className="font-metadata text-[10px] md:text-metadata text-on-surface-variant uppercase tracking-widest leading-tight">Active Listings</span>
                                <div><div className="font-headline-lg text-[24px] md:text-headline-lg">{dashboardData.activeListings}</div><div className="font-label-caps text-[8px] md:text-label-caps text-primary mt-1 md:mt-1">AVAILABLE NOW</div></div>
                            </div>
                            <div className="bg-surface-container-lowest border border-on-background p-3 md:p-6 shadow-[4px_4px_0_0_#17172A] flex flex-col justify-between min-h-[120px] md:min-h-[160px]">
                                <span className="font-metadata text-[10px] md:text-metadata text-on-surface-variant uppercase tracking-widest leading-tight">Total Views</span>
                                <div><div className="font-headline-lg text-[24px] md:text-headline-lg">{dashboardData.totalViews}</div><div className="font-label-caps text-[8px] md:text-label-caps text-primary mt-1 md:mt-1">LIFETIME</div></div>
                            </div>
                            <div className="col-span-2 md:col-span-1 bg-primary text-on-primary border border-on-background p-3 md:p-6 shadow-[4px_4px_0_0_#17172A] flex flex-col flex-row md:flex-col justify-between md:justify-between min-h-[100px] md:min-h-[160px]">
                                <div className="flex justify-between items-start md:items-start mb-2 md:mb-0">
                                    <span className="font-metadata text-[10px] md:text-metadata uppercase tracking-widest opacity-80 leading-tight">Buyer Inquiries</span>
                                    <span className="material-symbols-outlined text-[16px] md:text-[24px]">chat_bubble</span>
                                </div>
                                <div className="flex justify-between md:block items-end">
                                    <div className="font-headline-lg text-[28px] md:text-headline-lg leading-none">{dashboardData.buyerInquiries < 10 ? '0' + dashboardData.buyerInquiries : dashboardData.buyerInquiries}</div>
                                    <div className="font-label-caps text-[10px] md:text-label-caps text-primary-fixed-dim mt-1 md:mt-1 text-right md:text-left">MESSAGES</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <h3 className="font-headline-md border-b border-on-background pb-2 mb-6">MY_LISTINGS</h3>
                            <div className="flex flex-col gap-4">
                                {myListings.length === 0 ? (
                                    <div className="font-metadata text-on-surface-variant">YOU HAVE NO ACTIVE LISTINGS.</div>
                                ) : (
                                    myListings.map(item => (
                                        <div key={item._id} className="bg-surface-container-lowest border border-on-background p-3 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 hover:bg-surface-container-low transition-colors shadow-[4px_4px_0_0_#17172A] md:-translate-x-1 md:-translate-y-1 group cursor-pointer" onClick={() => navigate(`/product/${item._id}`)}>
                                            <div className="flex items-center gap-3 md:gap-4 w-full">
                                                <div className="w-16 h-16 md:w-24 md:h-16 bg-surface-dim border flex items-center justify-center overflow-hidden shrink-0">
                                                    {item.images && item.images[0] && item.images[0] !== 'default' ? <img src={item.images[0]} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[16px] md:text-[24px]">image</span>}
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <div className="font-body-lg text-[14px] md:text-body-lg text-on-background font-bold uppercase truncate whitespace-normal line-clamp-2 md:whitespace-nowrap">{item.title}</div>
                                                    <div className="font-metadata text-[10px] md:text-metadata text-on-surface-variant uppercase mt-1">STATUS: {item.status || 'AVAILABLE'}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-outline-variant md:border-none pt-3 md:pt-0 mt-1 md:mt-0">
                                                <div className="flex gap-4 md:gap-6 justify-between w-full md:w-auto">
                                                    <div className="text-center">
                                                        <div className="font-headline-sm text-[14px] md:text-headline-sm">₹{item.price}</div>
                                                        <div className="font-metadata text-[8px] md:text-metadata text-outline uppercase">PRICE</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-headline-sm text-[14px] md:text-headline-sm">{item.views}</div>
                                                        <div className="font-metadata text-[8px] md:text-metadata text-outline uppercase">VIEWS</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-headline-sm text-[14px] md:text-headline-sm text-primary">{item.inquiries < 10 ? '0' + item.inquiries : item.inquiries}</div>
                                                        <div className="font-metadata text-[8px] md:text-metadata text-outline uppercase text-primary">INQUIRIES</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                                    {deleteConfirmId === item._id ? (
                                                        <div className="flex gap-2 relative z-10 w-full" onClick={e => e.stopPropagation()}>
                                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="flex-1 bg-transparent border border-on-background md:px-3 py-2 md:py-1 font-label-caps text-[10px] md:text-label-caps hover:bg-surface-variant transition-colors uppercase">CANCEL</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="flex-1 bg-error text-on-error border border-error md:px-3 py-2 md:py-1 font-label-caps text-[10px] md:text-label-caps hover:opacity-80 transition-colors uppercase">CONFIRM</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 relative z-10 w-full" onClick={e => e.stopPropagation()}>
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/edit/${item._id}`); }} className="flex-1 border border-on-background md:px-3 py-2 md:py-1 font-label-caps text-[10px] md:text-label-caps uppercase hover:bg-on-background hover:text-surface transition-colors">EDIT</button>
                                                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item._id); }} className="flex-1 border border-error text-error md:px-3 py-2 md:py-1 font-label-caps text-[10px] md:text-label-caps uppercase hover:bg-error hover:text-on-primary transition-colors">DELETE</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Profile;
