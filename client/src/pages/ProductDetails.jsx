import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ProductDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // If it's a mock ID from an unmigrated component, handle it gracefully
                if (id.length < 24) {
                    throw new Error("Invalid Product ID.");
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
                const data = await res.json();
                if (res.ok && data.success) {
                    setProduct(data.data);
                    if (data.data.images && data.data.images.length > 0) {
                        setMainImage(data.data.images[0]);
                    }
                } else {
                    if (res.status === 401) throw new Error('AUTHENTICATION_REQUIRED');
                    if (res.status === 404) throw new Error('PRODUCT_NOT_FOUND');
                    throw new Error(data.error || 'SERVER_ERROR');
                }
            } catch (err) {
                console.error("Product Load Error:", err.message);
                if (err.message === 'Failed to fetch') {
                    setError('NETWORK_ERROR');
                } else if (['AUTHENTICATION_REQUIRED', 'PRODUCT_NOT_FOUND'].includes(err.message)) {
                    setError(err.message);
                } else {
                    setError('SERVER_ERROR');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-label-caps text-on-background">LOADING_ASSETS...</div>;

    if (error) {
        let errorMsg = 'Something went wrong. Please try again.';
        if (error === 'PRODUCT_NOT_FOUND') errorMsg = 'Listing not found.';
        if (error === 'AUTHENTICATION_REQUIRED') errorMsg = 'Please log in to view this listing.';
        if (error === 'NETWORK_ERROR') errorMsg = 'Unable to connect to the server.';
        if (error === 'SERVER_ERROR') errorMsg = 'Internal server error occurred.';

        return (
            <div className="min-h-screen flex flex-col items-center justify-center font-label-caps gap-2 text-on-background">
                <span className="text-error border border-error bg-error/10 px-4 py-2 mb-2 font-headline-md tracking-widest block uppercase shadow-hard">ERROR: {error}</span>
                <span className="text-secondary">{errorMsg}</span>
            </div>
        );
    }

    if (!product) return <div className="min-h-screen flex items-center justify-center font-label-caps text-on-background">404 // PRODUCT_NOT_FOUND</div>;

    // Compute Ownership locally via token payload parsing
    const isOwner = (() => {
        try {
            const token = localStorage.getItem('lumina_token');
            if (!token) return false;
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            return tokenPayload.id === product.seller._id;
        } catch (e) { return false; }
    })();

    const handleContactSeller = async () => {
        try {
            console.log('[PING_SELLER] clicked');
            console.log('[PING_SELLER] product:', product);
            console.log('[PING_SELLER] productId:', product?._id);
            console.log('[PING_SELLER] seller:', product?.seller);

            const token = localStorage.getItem('lumina_token');
            console.log('[PING_SELLER] token:', !!token);
            if (!token) {
                console.log('[PING_SELLER] User not authenticated, routing to login.');
                return navigate('/login');
            }

            console.log('[PING_SELLER] starting conversation...');
            const res = await fetch(import.meta.env.VITE_API_URL + '/api/messages/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: product._id
                })
            });

            console.log('[PING_SELLER] response status:', res.status);
            const data = await res.json();
            console.log('[PING_SELLER] response data:', data);

            if (data.success) {
                console.log('[PING_SELLER] conversation created/found:', data.data);
                navigate('/messages?conversationId=' + data.data._id);
            } else {
                console.error('[PING_SELLER] backend returned failure:', data.error);
                alert("We couldn't connect you with the seller. Please try again later.");
            }
        } catch (error) {
            console.error('[PING_SELLER] exception:', error);
            alert("Unable to reach the messaging server. Please check your connection and try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-gutter py-6 md:py-12">
                <section className="md:col-span-8 flex flex-col gap-unit">
                    <div className="w-full aspect-video flex items-center justify-center bg-surface-container-lowest border-technical relative overflow-hidden shadow-hard">
                        {mainImage ? (
                            <img alt={product.title} className="w-full h-full object-contain md:object-contain object-center" src={mainImage} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant font-label-caps text-outline">NO IMAGE AVAILABLE</div>
                        )}
                        {mainImage && (
                            <div className="absolute bottom-0 left-0 bg-surface-container-lowest border-technical px-2 py-1 md:px-3 md:py-1 m-2 md:m-4 z-10 hidden md:block">
                                <span className="font-metadata text-metadata text-on-background">IMG_01: PRIMARY_VIEW</span>
                            </div>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                            {product.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`thumbnail ${index + 1}`}
                                    onClick={() => setMainImage(img)}
                                    className={`h-16 w-16 md:h-20 md:w-20 bg-surface-container-lowest object-contain object-center border-technical cursor-pointer transition-opacity ${mainImage === img ? 'opacity-100 border-primary shadow-hard' : 'opacity-60 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                    )}
                </section>
                <section className="md:col-span-4 flex flex-col gap-4 md:gap-gutter">
                    <div className="flex flex-col gap-2 md:gap-4">
                        <h1 className="font-headline-lg text-[20px] md:text-headline-lg md:text-headline-lg text-on-background uppercase">{product.title}</h1>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-surface-container-lowest border-technical px-2 py-1 font-label-caps text-[10px] md:text-label-caps text-on-background uppercase">[ COND: {product.condition} ]</span>
                            <span className="bg-surface-container-lowest border-technical px-2 py-1 font-label-caps text-[10px] md:text-label-caps text-on-background uppercase">[ {product.college} ]</span>
                        </div>
                    </div>
                    <div className="bg-surface-container-lowest border-technical p-4 md:p-6 shadow-[4px_4px_0_0_#17172A]">
                        <div className="flex justify-between items-center border-b-technical pb-2 mb-2 md:mb-4">
                            <span className="font-label-caps text-[10px] md:text-label-caps text-on-background uppercase">MARKET_INDEX</span>
                            <span className="material-symbols-outlined text-[16px] md:text-[24px] text-outline">analytics</span>
                        </div>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <span className="font-metadata text-[10px] md:text-metadata text-outline">LISTING_PRICE:</span>
                            <div className="font-headline-md text-[20px] md:text-[24px] text-primary">₹{product.price.toLocaleString()}</div>
                        </div>
                        <div className="mt-4 border-t-technical pt-2 md:pt-4 text-[12px] md:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {product.description}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-4">
                        {isOwner ? (
                            <>
                                <button onClick={() => navigate('/edit/' + product._id)} className="w-full bg-transparent text-on-background font-label-caps py-4 uppercase border-technical hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 border-dashed">
                                    [ EDIT_LISTING ]
                                    <span className="material-symbols-outlined text-metadata">edit</span>
                                </button>

                                {!showDeleteConfirm ? (
                                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full bg-error text-on-error font-label-caps py-4 uppercase border-technical hover:bg-transparent hover:text-error transition-colors flex items-center justify-center gap-2 shadow-hard group">
                                        [ DELETE_LISTING ]
                                        <span className="material-symbols-outlined text-metadata group-hover:text-error">delete</span>
                                    </button>
                                ) : (
                                    <div className="bg-surface-container-lowest border-error border p-4 flex flex-col gap-4">
                                        <div className="font-label-caps text-error text-center uppercase">DELETE LISTING?</div>
                                        <div className="font-body-sm text-on-surface-variant text-center">This action cannot be undone.</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-transparent border-technical py-2 font-label-caps uppercase hover:bg-surface-variant transition-colors">
                                                [ CANCEL ]
                                            </button>
                                            <button onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('lumina_token');
                                                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product._id}`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        alert('LISTING DELETED ✓');
                                                        navigate('/profile');
                                                    } else {
                                                        console.error("Product Delete Rejection:", data.error);
                                                        alert("We couldn't delete the listing. Please try again.");
                                                    }
                                                } catch (err) {
                                                    console.error("Product Delete Exception:", err);
                                                    alert("Unable to connect to the server. Please try again.");
                                                }
                                            }} className="flex-1 bg-error text-on-error border-error py-2 font-label-caps uppercase hover:opacity-80 transition-opacity">
                                                [ DELETE ]
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={handleContactSeller} className="w-full bg-primary text-on-primary font-label-caps py-4 uppercase border-technical hover:bg-on-background transition-colors flex items-center justify-center gap-2 shadow-hard group">
                                    [ PING_SELLER ]
                                    <span className="material-symbols-outlined text-metadata group-hover:text-primary transition-colors">chat</span>
                                </button>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ProductDetails;
