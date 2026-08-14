import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CATEGORIES = {
    'ALL': [],
    'ELECTRONICS': ['Phones', 'Laptops', 'Tablets', 'Cameras', 'Speakers', 'Headphones/Earphones', 'Smartwatches/Watches', 'Chargers/Power Banks', 'Keyboard/Mouse', 'Calculators', 'Printers', 'Fans/Coolers', 'Other Electronics'],
    'STUDY & ACADEMICS': ['Books', 'Notes', 'Lab Manuals', 'Lab Instruments', 'Engineering Instruments', 'Scientific Instruments', 'Calculators', 'Stationery', 'Drawing/Drafting Tools', 'Competitive Exam Material', 'Study Resources', 'Other Study Items'],
    'VEHICLES & MOBILITY': ['Cycles', 'Bikes', 'Scooters', 'Helmets', 'Bicycle Accessories', 'Travel/Commuting Accessories', 'Other Mobility'],
    'HOSTEL & LIVING': ['Tables', 'Chairs', 'Study Lamps', 'Bedsheets', 'Buckets', 'Coolers', 'Fans', 'Mattresses', 'Pillows', 'Storage/Organizers', 'Kitchen Items', 'Room Decor', 'Other Hostel Essentials']
};

const Search = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeSubcategory, setActiveSubcategory] = useState('');
    const [keyword, setKeyword] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const cat = queryParams.get('category');
        const subcat = queryParams.get('subcategory');
        const kw = queryParams.get('keyword');

        if (cat && Object.keys(CATEGORIES).includes(cat)) {
            setActiveCategory(cat);
            if (subcat && CATEGORIES[cat].includes(subcat)) {
                setActiveSubcategory(subcat);
            } else {
                setActiveSubcategory('');
            }
        } else {
            setActiveCategory('ALL');
            setActiveSubcategory('');
        }

        if (kw) {
            setKeyword(kw);
        } else {
            setKeyword('');
        }
    }, [location.search]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let url = 'http://localhost:5000/api/products?';
                const params = new URLSearchParams();

                if (activeCategory !== 'ALL') {
                    params.append('category', activeCategory);
                    if (activeSubcategory) {
                        params.append('subcategory', activeSubcategory);
                    }
                }

                if (keyword) {
                    params.append('keyword', keyword);
                }

                const finalUrl = url + params.toString();
                const res = await fetch(finalUrl);
                const data = await res.json();
                if (res.ok && data.success) {
                    setProducts(data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [activeCategory, activeSubcategory, keyword]);

    const handleCategoryClick = (cat) => {
        const params = new URLSearchParams(location.search);
        params.delete('subcategory');

        if (cat === 'ALL') {
            params.delete('category');
        } else {
            params.set('category', cat);
        }
        navigate(`/search?${params.toString()}`);
    };

    const handleSubcategoryClick = (subcat) => {
        const params = new URLSearchParams(location.search);
        if (subcat === activeSubcategory) {
            params.delete('subcategory'); // toggle off
        } else {
            params.set('subcategory', subcat);
        }
        navigate(`/search?${params.toString()}`);
    };

    const removeKeyword = () => {
        const params = new URLSearchParams(location.search);
        params.delete('keyword');
        navigate(`/search?${params.toString()}`);
    }

    return (
        <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-12 flex flex-col gap-4 md:gap-gutter">
            <div className="md:hidden w-full relative mb-2">
                <div className="flex border-technical bg-surface focus-within:border-primary transition-colors">
                    <span className="material-symbols-outlined text-outline p-3 flex items-center bg-surface-container-low border-r-technical" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                    <input
                        className="block w-full p-3 font-metadata text-metadata text-on-surface bg-transparent focus:ring-0 focus:border-none outline-none placeholder:text-outline-variant"
                        placeholder="QUERY ITEM..."
                        defaultValue={keyword}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const queries = new URLSearchParams(location.search);
                                if (e.target.value.trim()) {
                                    queries.set('keyword', e.target.value.trim());
                                } else {
                                    queries.delete('keyword');
                                }
                                navigate(`/search?${queries.toString()}`);
                            }
                        }}
                    />
                </div>
            </div>

            <header className="border-b-technical pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-end mb-0 md:mb-4 gap-2 md:gap-4">
                <div>
                    <h1 className="font-headline-lg text-[24px] md:text-headline-lg text-on-background blinking-cursor tracking-tighter uppercase md:normal-case">&gt; MARKET_QUERY</h1>
                    <p className="font-metadata text-[10px] md:text-metadata text-on-surface-variant uppercase mt-1 md:mt-2">INDEXING {products.length} ITEMS // IIT BHU</p>
                </div>
                <div className="hidden md:flex items-center gap-4 bg-surface-container-lowest border-technical p-1 px-3 shadow-hard">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    <span className="font-label-caps text-label-caps text-on-background">LOCATION: IIT BHU</span>
                </div>
            </header>

            {keyword && (
                <div className="mb-4 flex items-center gap-2">
                    <span className="font-metadata text-metadata text-on-surface-variant flex items-center gap-2">
                        SEARCHING FOR:
                        <span className="bg-primary text-on-primary px-3 py-1 font-label-caps flex items-center gap-2">
                            "{keyword}"
                            <span className="material-symbols-outlined text-[14px] cursor-pointer" onClick={removeKeyword}>close</span>
                        </span>
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-gutter">
                <aside className="lg:col-span-3 flex flex-col gap-4 md:gap-gutter">
                    <div className="border-technical bg-surface-container-lowest flex flex-col">
                        <div className="p-4 border-b-technical bg-on-background flex items-center gap-2 text-surface">
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                            <span className="font-label-caps text-label-caps">FILTERS</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <h3 className="font-metadata text-metadata text-outline">CATEGORY_INDEX</h3>

                            <div className="flex flex-col gap-2">
                                {Object.keys(CATEGORIES).map(cat => (
                                    <div key={cat} className="flex flex-col">
                                        <button
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`text-left p-2 font-label-caps text-label-caps border-l-2 transition-colors flex justify-between items-center uppercase ${activeCategory === cat ? 'border-primary bg-surface-variant text-primary font-bold' : 'border-transparent text-on-surface hover:bg-surface-container-low hover:text-on-background'}`}
                                        >
                                            {cat} {activeCategory === cat && <span className="material-symbols-outlined text-[14px]">check</span>}
                                        </button>

                                        {/* Subcategories */}
                                        {activeCategory === cat && CATEGORIES[cat].length > 0 && (
                                            <div className="flex flex-col gap-1 pl-4 mt-2 mb-2 border-l border-outline-variant ml-2">
                                                {CATEGORIES[cat].map(subcat => (
                                                    <button
                                                        key={subcat}
                                                        onClick={() => handleSubcategoryClick(subcat)}
                                                        className={`text-left p-1 text-[11px] font-metadata uppercase transition-colors ${activeSubcategory === subcat ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-background'}`}
                                                    >
                                                        {activeSubcategory === subcat ? '> ' : ''}{subcat}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-9">
                    {loading ? (
                        <div className="p-12 text-center font-label-caps text-on-background">LOADING_MARKET_DATA...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-gutter">
                                {products.map(product => (
                                    <div key={product._id} onClick={() => navigate(`/product/${product._id}`)} className="border-technical bg-surface flex flex-col shadow-[4px_4px_0_0_#17172A] md:-translate-x-1 md:-translate-y-1 transition-all duration-200 cursor-pointer group relative">
                                        <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10 bg-surface-container-highest text-on-background font-label-caps text-[8px] md:text-metadata px-1 py-0.5 md:px-2 md:py-1 border-technical flex items-center gap-1 shadow-sm uppercase">
                                            {product.condition}
                                        </div>
                                        <div className="h-24 md:h-[240px] border-b-technical bg-surface-container flex items-center justify-center relative overflow-hidden group-hover:bg-surface-variant">
                                            {product.images && product.images.length > 0 ? (
                                                <img alt={product.title} className="object-cover md:object-contain object-center h-full w-full transition-all duration-300" src={product.images[0]} />
                                            ) : (
                                                <span className="font-label-caps text-[10px] md:text-label-caps text-outline">NO_IMG</span>
                                            )}
                                        </div>
                                        <div className="p-2 md:p-4 flex flex-col gap-1 md:gap-2 justify-between flex-grow">
                                            <div>
                                                <h3 className="font-headline-sm text-[12px] md:text-body-md md:font-bold text-on-surface leading-tight mb-1 truncate md:whitespace-normal md:line-clamp-1 uppercase md:normal-case">{product.title}</h3>
                                                <span className="font-headline-sm text-[14px] md:text-label-caps text-primary block md:inline-block md:border-b-2 md:border-primary">₹{product.price.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-outline-variant md:border-none pt-1 md:pt-0 mt-auto md:mt-2 font-metadata text-[8px] md:text-metadata text-on-surface-variant flex gap-4 md:mt-2">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px] md:text-[14px] hidden md:block">person</span> {product.seller?.name || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {products.length === 0 && (
                                <div className="p-12 border-technical border-dashed bg-surface-container-low flex flex-col items-center justify-center text-center">
                                    <span className="material-symbols-outlined text-4xl text-outline mb-4">search_off</span>
                                    <h3 className="font-headline-sm text-headline-sm text-on-background">NO_RESULTS_FOUND</h3>
                                    <p className="font-metadata text-metadata text-on-surface-variant mt-2">Modify search parameters and retry query.</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Search;
