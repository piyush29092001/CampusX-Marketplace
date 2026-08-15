import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ImageCropModal from '../components/ImageCropModal';

const EditListing = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const [productData, setProductData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Electronics',
        condition: 'Good',
        images: []
    });

    const [cropQueue, setCropQueue] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
                const data = await res.json();
                if (data.success) {
                    setProductData({
                        title: data.data.title || '',
                        description: data.data.description || '',
                        price: data.data.price || '',
                        category: data.data.category || 'Other',
                        condition: data.data.condition || 'Good',
                        images: data.data.images || []
                    });
                } else {
                    console.error("Product Load Rejection:", data.error);
                    alert("We couldn't load this listing. Please try again.");
                    navigate('/');
                }
            } catch (err) {
                console.error("Product Load Exception:", err);
                alert("Unable to connect to the server. Please try again.");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    const handleDataChange = (e) => {
        setProductData({ ...productData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        let newQueue = [];
        for (let file of files) {
            if (file.size > 10 * 1024 * 1024) {
                alert(`IMAGE TOO LARGE\nPlease choose an image under 10 MB for ${file.name}.`);
                continue;
            }
            if (productData.images.length + cropQueue.length + newQueue.length >= 5) {
                break; // Ignore items beyond 5 limit
            }
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            newQueue.push(dataUrl);
        }
        setCropQueue(prev => [...prev, ...newQueue]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCropComplete = (croppedBase64) => {
        setProductData(prev => {
            if (prev.images.length >= 5) return prev;
            return { ...prev, images: [...prev.images, croppedBase64] };
        });
        setCropQueue(prev => prev.slice(1));
    };

    const handleRemoveImage = (indexToRemove) => {
        setProductData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleSaveChanges = async () => {
        if (!productData.title || !productData.price || !productData.description) {
            return alert('Missing required fields');
        }
        try {
            const token = localStorage.getItem('lumina_token');
            const payload = { ...productData, price: Number(productData.price) };
            if (payload.images.length === 0) payload.images = ['default'];

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert('LISTING UPDATED ✓');
                navigate(`/product/${id}`);
            } else {
                console.error("Listing Update Rejection:", data.error);
                alert("We couldn't update your listing. Please try again.");
            }
        } catch (err) {
            console.error("Listing Update Exception:", err);
            alert("Unable to connect to the server. Please check your connection and try again.");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center font-label-caps uppercase">LOADING_LISTING_CONFIG...</div>;

    return (
        <div className="min-h-screen flex flex-col py-12 px-margin-mobile md:px-margin-desktop bg-surface relative">
            <h1 className="font-headline-lg text-primary uppercase text-center mb-12">CONFIG: EDIT_LISTING</h1>

            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 gap-gutter border-technical p-6 bg-surface-container-lowest shadow-hard relative overflow-hidden group">
                <div className="absolute -right-16 top-10 rotate-45 border-technical bg-surface-variant font-metadata px-20 py-2 shadow-hard hidden md:block opacity-50 uppercase">
                    SYS_OVERRIDE
                </div>

                <section className="flex flex-col gap-4 border-b-technical pb-6">
                    <label className="font-label-caps text-on-surface uppercase">[ LISTING_TITLE ]</label>
                    <input name="title" value={productData.title} onChange={handleDataChange} className="bg-transparent border-technical p-4 font-body-md text-on-background focus:outline-none focus:border-primary transition-colors uppercase w-full" />
                </section>

                <section className="flex flex-col gap-4 border-b-technical pb-6">
                    <label className="font-label-caps text-on-surface uppercase">[ MARKET_PRICE_₹ ]</label>
                    <input type="number" name="price" value={productData.price} onChange={handleDataChange} className="bg-transparent border-technical p-4 font-headline-md text-primary focus:outline-none focus:border-primary transition-colors appearance-none w-full" placeholder="0" min="0" />
                </section>

                <section className="flex flex-col gap-4 border-b-technical pb-6">
                    <label className="font-label-caps text-on-surface uppercase">[ ARCHIVE_DESCRIPTION ]</label>
                    <textarea name="description" value={productData.description} onChange={handleDataChange} rows={6} className="bg-transparent border-technical p-4 font-body-sm text-on-background focus:outline-none focus:border-primary transition-colors w-full resize-y" />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter border-b-technical pb-6">
                    <section className="flex flex-col gap-4">
                        <label className="font-label-caps text-on-surface uppercase">[ CATEGORY ]</label>
                        <select name="category" value={productData.category} onChange={handleDataChange} className="bg-transparent border-technical p-4 font-body-md text-on-background focus:outline-none focus:border-primary uppercase cursor-pointer rounded-none appearance-none">
                            <option>Electronics</option>
                            <option>Books</option>
                            <option>Two Wheelers</option>
                            <option>Laptops</option>
                            <option>Phones</option>
                            <option>Cycles</option>
                            <option>Furniture</option>
                            <option>Other</option>
                        </select>
                    </section>
                    <section className="flex flex-col gap-4">
                        <label className="font-label-caps text-on-surface uppercase">[ CONDITION ]</label>
                        <select name="condition" value={productData.condition} onChange={handleDataChange} className="bg-transparent border-technical p-4 font-body-md text-on-background focus:outline-none focus:border-primary uppercase cursor-pointer rounded-none appearance-none">
                            <option>Like New</option>
                            <option>Good</option>
                            <option>Fair</option>
                            <option>Poor</option>
                        </select>
                    </section>
                </div>

                <section className="flex flex-col gap-4 border-b-technical pb-6">
                    <label className="font-label-caps text-on-surface uppercase">[ DIGITAL_ASSETS ] (MAX 5)</label>
                    <div className="flex gap-4 overflow-x-auto py-2">
                        {productData.images.map((img, i) => (
                            <div key={i} className="relative group/img cursor-pointer shrink-0 border-technical shadow-hard">
                                <img src={img} alt={`Asset ${i}`} className="w-24 h-24 object-contain object-center" />
                                <div onClick={() => handleRemoveImage(i)} className="absolute inset-0 bg-error/90 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-on-error">delete</span>
                                </div>
                            </div>
                        ))}
                        {productData.images.length < 5 && (
                            <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-technical bg-transparent flex flex-col items-center justify-center hover:bg-surface-variant transition-colors group/btn shrink-0">
                                <span className="material-symbols-outlined text-outline group-hover/btn:text-primary transition-colors">add</span>
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" className="hidden" multiple />
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSaveChanges} className="bg-primary text-on-primary font-label-caps px-12 py-4 uppercase border-technical hover:bg-on-background transition-colors shadow-hard flex items-center gap-2 group">
                        [ SAVE_CHANGES ]
                        <span className="material-symbols-outlined text-metadata group-hover:translate-x-1 transition-transform">done_all</span>
                    </button>
                </div>
            </div>

            {cropQueue.length > 0 && (
                <ImageCropModal
                    imageSrc={cropQueue[0]}
                    onCropComplete={handleCropComplete}
                    onClose={() => setCropQueue(prev => prev.slice(1))}
                />
            )}
        </div>
    );
};

export default EditListing;
