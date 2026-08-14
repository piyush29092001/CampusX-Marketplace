import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products?limit=2');
                const data = await res.json();
                if (res.ok && data.success) {
                    setProducts(data.data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="dotted-grid min-h-screen">
            <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 md:py-12 flex flex-col gap-6 md:gap-gutter">
                <section className="border-technical bg-surface border-on-background flex flex-col md:flex-row min-h-[400px] overflow-hidden group shadow-[4px_4px_0_0_#17172A] relative">
                    <div className="flex-1 p-12 flex flex-col justify-center border-b-0 border-r-technical relative z-10 bg-surface">
                        <div className="font-metadata text-[11px] text-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">terminal</span> <span>SYS_INIT // COLLEGE_MARKET_0.9</span>
                        </div>
                        <h1 className="font-headline-lg text-[32px] text-on-surface mb-6 uppercase tracking-tighter leading-tight">BUY SMART.<br />SELL LOCAL.</h1>
                        <p className="font-body-lg text-[16px] text-on-surface-variant max-w-md mb-8">The decentralized, peer-to-peer marketplace engineered for campus utility. High-fidelity trading, zero friction.</p>
                        <div className="w-full max-w-lg relative flex mt-0">
                            <div className="flex-1 border-technical border-r bg-surface flex items-center focus-within:border-primary transition-colors">
                                <span className="font-metadata text-metadata text-outline ml-2 pl-2">&gt;</span>
                                <input className="block w-full p-3 font-metadata text-metadata text-on-surface bg-transparent focus:ring-0 focus:border-none outline-none placeholder:text-outline-variant" placeholder="QUERY ITEM..." />
                            </div>
                            <button onClick={() => navigate('/search')} className="px-6 font-label-caps lg-text-label-caps bg-on-background text-surface border-technical hover:bg-primary transition-colors flex items-center justify-center gap-2"><span>EXECUTE</span> <span className="inline-block w-2 h-2 bg-surface"></span></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-surface-container relative overflow-hidden dotted-grid min-h-full items-center justify-center flex">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20"><span className="material-symbols-outlined text-[200px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schema</span></div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    <div className="lg:col-span-4 flex flex-col gap-gutter">
                        <div className="border-technical bg-surface-container-lowest flex flex-col h-full">
                            <div className="p-4 border-b-technical bg-surface-container-low flex justify-between items-center">
                                <h2 className="font-label-caps text-label-caps text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">category</span> INDEX_CATEGORIES</h2>
                            </div>
                            <div className="flex flex-col flex-grow">
                                {['NOTES', 'LAPTOPS', 'TWO WHEELERS', 'FURNITURE'].map(cat => (
                                    <Link key={cat} className="p-4 border-b-technical flex items-center justify-between hover:bg-primary hover:text-on-primary transition-colors group" to={`/search?category=${encodeURIComponent(cat)}`}>
                                        <span className="font-label-caps text-label-caps text-on-surface group-hover:text-on-primary">{cat}</span>
                                        <span className="material-symbols-outlined text-outline group-hover:text-on-primary">arrow_forward</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-8 flex flex-col gap-4 md:gap-gutter">
                        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end border-b-technical pb-2 md:pb-2 mb-2 md:mb-0">
                            <h2 className="font-label-caps md:font-headline-sm text-label-caps md:text-headline-sm text-on-surface-variant md:text-on-surface flex items-center gap-2 mb-2 md:mb-0">LIVE_FEED // TRENDING</h2>
                            <Link className="hidden md:block font-metadata text-metadata text-primary hover:underline" to="/search">VIEW_ALL &gt;</Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-gutter">
                            {products.map((product, index) => (
                                <div key={product._id} onClick={() => navigate(`/product/${product._id}`)} className="border-technical bg-surface flex flex-col shadow-[4px_4px_0_0_#17172A] md:-translate-x-1 md:-translate-y-1 transition-transform duration-200 cursor-pointer group relative">
                                    <div className={`absolute top-1 right-1 md:top-2 md:right-2 z-10 ${index === 0 ? 'bg-primary text-on-primary' : 'bg-on-background text-surface'} font-label-caps text-[8px] md:text-metadata px-1 py-0.5 md:px-2 md:py-1 border-technical flex items-center gap-1`}>
                                        <span className="material-symbols-outlined text-[10px] md:text-[12px] hidden md:block">{index === 0 ? 'auto_awesome' : 'whatshot'}</span>
                                        {index === 0 ? 'GREAT_PRICE' : 'HIGH_DEMAND'}
                                    </div>
                                    <div className="h-24 md:h-[240px] border-b-technical bg-surface-container flex items-center justify-center relative overflow-hidden">
                                        {product.images && product.images.length > 0 ? (
                                            <img alt={product.title} className="object-cover md:object-contain object-center h-full w-full transition-all duration-300" src={product.images[0]} />
                                        ) : (
                                            <span className="font-label-caps text-outline">NO_IMG</span>
                                        )}
                                    </div>
                                    <div className="p-2 md:p-4 flex flex-col justify-between flex-grow">
                                        <div>
                                            <h3 className="font-headline-sm text-[12px] md:text-body-md leading-tight mb-1 truncate md:whitespace-normal md:line-clamp-1">{product.title}</h3>
                                            <span className="font-headline-sm text-[14px] md:text-label-caps text-primary block mb-2 md:mb-0 md:inline-block md:border-b-2 md:border-primary">₹{product.price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-outline-variant md:border-none pt-1 md:pt-0 mt-auto md:mt-2 font-metadata text-[8px] md:text-metadata text-on-surface-variant md:text-on-surface-variant">
                                            <span className="flex items-center md:gap-1 truncate w-1/2 md:w-auto"><span className="material-symbols-outlined text-[10px] md:text-[14px] hidden md:block">location_on</span> {product.college || 'UNKNOWN_USR'}</span>
                                            <span className="flex items-center md:gap-1 text-primary"><span className="material-symbols-outlined text-[10px] md:text-[14px] hidden md:block">timer</span> {new Date(product.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Home;
