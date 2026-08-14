import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, AlertCircle, ShieldCheck, CheckSquare, Edit3 } from 'lucide-react';
import ImageCropModal from '../components/ImageCropModal';

const Sell = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [productData, setProductData] = useState({
        productName: '',
        category: 'ELECTRONICS',
        brand: '',
        model: '',
        purchaseYear: '',
        originalPrice: '',
        additionalInformation: ''
    });

    const [images, setImages] = useState([]);
    const [pendingCropImage, setPendingCropImage] = useState(null);

    const [aiStatus, setAiStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
    const [loadingMessage, setLoadingMessage] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [aiError, setAiError] = useState('');

    const [finalData, setFinalData] = useState({
        condition: '',
        price: '',
        description: ''
    });

    const handleProductDataChange = (e) => {
        setProductData({ ...productData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const file = files[0];
            if (file.size > 10 * 1024 * 1024) {
                return alert("IMAGE TOO LARGE\nPlease choose an image under 10 MB.");
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPendingCropImage(reader.result);
                e.target.value = null; // Clear input
            };
            reader.readAsDataURL(file);
        }
    };

    const runAiAnalysis = async () => {
        if (!productData.productName) {
            alert('Please enter a product name first.');
            return;
        }

        setStep(3);
        setAiStatus('LOADING');

        // Start showing the messages immediately, but run the API request in parallel
        const messages = [
            'ANALYZING_PRODUCT...',
            'VALIDATING_PRODUCT_NAME...',
            'ANALYZING_IMAGE...',
            'ESTIMATING_CONDITION...',
            'CALCULATING_PRICE...',
            'GENERATING_DESCRIPTIONS...'
        ];

        let messageIndex = 0;
        setLoadingMessage(messages[0]);
        const messageInterval = setInterval(() => {
            messageIndex++;
            if (messageIndex < messages.length) {
                setLoadingMessage(messages[messageIndex]);
            }
        }, 500);

        try {
            const res = await fetch('http://localhost:5000/api/ai/analyze-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productData, productImages: images })
            });

            clearInterval(messageInterval);

            const data = await res.json();

            if (!res.ok || data.success === false) {
                throw new Error(data.message || 'AI Service block');
            }

            if (data.validProduct === false) {
                setAiError(data.message || 'PRODUCT_ANALYSIS_FAILED: Invalid product name.');
                setAiStatus('ERROR');
            } else {
                setAiResponse(data);
                setFinalData({
                    condition: data.condition,
                    price: data.recommendedPrice,
                    description: data.descriptions.short35
                });
                setAiStatus('SUCCESS');
                setStep(4);
            }
        } catch (error) {
            clearInterval(messageInterval);
            console.error(error);
            setAiError(error.message || 'AI_SERVICE_UNAVAILABLE - AI assistance is temporarily unavailable.');
            setAiStatus('ERROR');
        }
    };

    const handleManualFallback = () => {
        setAiStatus('IDLE');
        setStep(4);
    };

    const handlePublish = async () => {
        try {
            const token = localStorage.getItem('lumina_token');
            if (!token) {
                alert('Authentication missing. Please log in.');
                return navigate('/login');
            }

            const payload = {
                title: aiResponse?.productName || productData.productName,
                description: finalData.description || 'No description provided.',
                price: Number(finalData.price) || 0,
                category: aiResponse?.category || productData.category,
                subcategory: aiResponse?.subcategory || '',
                tags: aiResponse?.tags || [],
                searchKeywords: aiResponse?.searchKeywords || [],
                condition: ['Like New', 'Good', 'Fair', 'Poor'].includes(finalData.condition)
                    ? finalData.condition : 'Good',
                images: images.length > 0 ? images : ['default']
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                navigate('/profile');
            } else {
                alert(data.error || data.message || 'Failed to publish listing');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to publish listing');
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-mono bg-[#fcf8ff] text-[#1b1b24] relative">
            <div
                className="absolute inset-0 pointer-events-none opacity-5 z-0"
                style={{
                    backgroundImage: 'radial-gradient(#17172A 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-12 py-6 md:py-12 flex flex-col gap-4 md:gap-6 relative z-10 w-full mb-12">
                <header className="flex flex-col gap-1 md:gap-2 border-b border-[#17172A] pb-4 md:pb-6 mb-2 md:mb-4">
                    <h1 className="text-[20px] md:text-3xl font-bold uppercase tracking-tight text-[#1b1b24]">&gt; CREATE_NEW_LISTING<span className="animate-pulse text-[#250fc2]">_</span></h1>
                    <p className="text-[10px] md:text-[11px] text-[#777587] uppercase tracking-widest font-bold">CampusX AI LISTING ASSISTANT</p>
                </header>

                <div className="flex gap-2 md:gap-4 text-[10px] md:text-xs font-bold uppercase tracking-widest overflow-x-auto pb-2 whitespace-nowrap scrollbar-hide">
                    <span className={`${step >= 1 ? 'text-[#250fc2]' : 'text-[#777587]'}`}>01_PRODUCT</span> <span className="text-[#c7c4d8]">/</span>
                    <span className={`${step >= 2 ? 'text-[#250fc2]' : 'text-[#777587]'}`}>02_IMAGES</span> <span className="text-[#c7c4d8]">/</span>
                    <span className={`${step === 3 ? 'text-[#250fc2]' : 'text-[#777587]'}`}>03_AI_ANALYSIS</span> <span className="text-[#c7c4d8]">/</span>
                    <span className={`${step >= 4 ? 'text-[#250fc2]' : 'text-[#777587]'}`}>04_AI_REVIEW</span> <span className="text-[#c7c4d8]">/</span>
                    <span className={`${step >= 5 ? 'text-[#250fc2]' : 'text-[#777587]'}`}>05_PREVIEW</span>
                </div>

                <div className="bg-white border border-[#17172A] p-4 md:p-8 shadow-[4px_4px_0_#17172A] flex flex-col gap-6 md:gap-8">

                    {step === 1 && (
                        <div className="flex flex-col gap-6 animate-fade-in">
                            <h2 className="text-lg md:text-xl font-bold uppercase">01 // PRODUCT_INFORMATION</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#464555]">ENTER_PRODUCT_NAME *</label>
                                    <div className="flex items-center border border-[#17172A] bg-[#fcf8ff] focus-within:border-[#250fc2] transition-colors relative">
                                        <span className="pl-3 md:pl-4 text-[#17172A] font-bold">{">"}</span>
                                        <input
                                            name="productName"
                                            value={productData.productName}
                                            onChange={handleProductDataChange}
                                            className="w-full bg-transparent p-2 md:p-3 text-sm focus:outline-none uppercase"
                                            placeholder="E.G. LAPTOP, BOOK"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#464555]">CATEGORY</label>
                                    <select name="category" value={productData.category} onChange={handleProductDataChange} className="border border-[#17172A] bg-white p-2 md:p-3 text-sm focus:outline-none uppercase">
                                        <option value="ELECTRONICS">ELECTRONICS</option>
                                        <option value="STUDY & ACADEMICS">STUDY & ACADEMICS</option>
                                        <option value="VEHICLES & MOBILITY">VEHICLES & MOBILITY</option>
                                        <option value="HOSTEL & LIVING">HOSTEL & LIVING</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#464555]">BRAND (OPTIONAL)</label>
                                    <input name="brand" value={productData.brand} onChange={handleProductDataChange} className="border border-[#17172A] p-2 md:p-3 text-sm uppercase focus:outline-none focus:border-[#250fc2]" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#464555]">PURCHASE YEAR (OPTIONAL)</label>
                                    <input name="purchaseYear" value={productData.purchaseYear} onChange={handleProductDataChange} className="border border-[#17172A] p-2 md:p-3 text-sm uppercase focus:outline-none focus:border-[#250fc2]" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-2 md:mt-4">
                                <button onClick={() => setStep(2)} className="w-full md:w-auto border border-[#17172A] bg-[#250fc2] text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#1b1b24] transition-colors shadow-[2px_2px_0_#17172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#17172A]">
                                    CONTINUE_TO_IMAGES
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col gap-6 animate-fade-in">
                            <h2 className="text-lg md:text-xl font-bold uppercase">02 // PRODUCT_IMAGES</h2>
                            <div className="border border-[#17172A] border-dashed p-8 md:p-12 flex flex-col items-center justify-center gap-4 bg-[#fcf8ff] text-center cursor-pointer hover:bg-[#efecf9] transition-colors relative group">
                                <Upload className="w-8 h-8 text-[#777587] group-hover:text-[#250fc2]" strokeWidth={1.5} />
                                <p className="text-[11px] font-bold uppercase tracking-widest text-[#464555]">CLICK_TO_UPLOAD_IMAGES</p>
                                <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                            {images.length > 0 && (
                                <div className="flex gap-4 mt-2">
                                    {images.map((img, idx) => (
                                        <img key={idx} src={img} className="w-24 h-24 object-contain object-center border border-[#17172A]" />
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between mt-4">
                                <button onClick={() => setStep(1)} className="border border-[#17172A] bg-white text-[#1b1b24] px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#efecf9] transition-colors">
                                    BACK
                                </button>
                                <button onClick={runAiAnalysis} className="border border-[#17172A] bg-[#250fc2] text-white px-6 py-3 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#1b1b24] transition-colors shadow-[2px_2px_0_#17172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#17172A]">
                                    <ShieldCheck className="w-4 h-4" /> ANALYZE_PRODUCT
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && aiStatus === 'LOADING' && (
                        <div className="flex flex-col items-center justify-center py-20 gap-6 animate-pulse">
                            <Loader2 className="w-12 h-12 text-[#250fc2] animate-spin" strokeWidth={1.5} />
                            <div className="text-center flex flex-col gap-2">
                                <h2 className="text-lg font-bold uppercase tracking-tight text-[#1b1b24]">CampusX AI Assistant</h2>
                                <p className="text-xs uppercase tracking-widest font-bold text-[#464555]">{loadingMessage}</p>
                            </div>
                        </div>
                    )}

                    {step === 3 && aiStatus === 'ERROR' && (
                        <div className="flex flex-col py-10 gap-6 border-l-4 border-[#ba1a1a] bg-[#ffdad6] p-6 border-y border-r border-y-[#17172A] border-r-[#17172A]">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-[#93000a]" strokeWidth={2} />
                                <h3 className="text-base font-bold uppercase text-[#93000a]">ANALYSIS_FAILED</h3>
                            </div>
                            <p className="text-sm font-bold text-[#93000a] leading-relaxed">{aiError}</p>
                            <div className="flex gap-4 mt-2">
                                <button onClick={() => setStep(1)} className="border border-[#93000a] bg-white text-[#93000a] px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#93000a] hover:text-white transition-colors">
                                    TRY_AGAIN
                                </button>
                                <button onClick={handleManualFallback} className="border border-[#93000a] bg-[#93000a] text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#1b1b24] hover:border-[#1b1b24] transition-colors shadow-[2px_2px_0_#93000a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#93000a]">
                                    ENTER_MANUALLY
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex flex-col gap-4 md:gap-6 animate-fade-in">
                            <h2 className="text-lg md:text-xl font-bold uppercase flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                                <span>04 // AI_ANALYSIS_REVIEW</span>
                                {aiResponse && <span className="text-[10px] bg-[#f5f2ff] text-[#250fc2] border border-[#250fc2] px-2 py-1 flex items-center gap-1 w-fit"><ShieldCheck className="w-3 h-3" /> AI_GENERATED</span>}
                            </h2>

                            {aiResponse ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 border border-[#17172A] p-4 md:p-6 bg-[#fcf8ff]">
                                    {/* Left Column: Data Analysis */}
                                    <div className="flex flex-col gap-4 md:gap-6">
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-[11px] md:text-sm font-bold uppercase tracking-widest border-b border-[#17172A] pb-1 text-[#464555] flex items-center gap-2"><CheckSquare className="w-4 h-4 text-[#250fc2]" /> PRODUCT_ANALYSIS</h3>
                                            <div className="grid grid-cols-2 gap-y-2 mt-1">
                                                <span className="text-[10px] text-[#777587] font-bold">NAME</span><span className="text-xs font-bold uppercase">{aiResponse.productName || 'N/A'}</span>
                                                <span className="text-[10px] text-[#777587] font-bold">BRAND</span><span className="text-xs font-bold uppercase">{aiResponse.brand || 'N/A'}</span>
                                                <span className="text-[10px] text-[#777587] font-bold">MODEL</span><span className="text-xs font-bold uppercase">{aiResponse.model || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-[11px] md:text-sm font-bold uppercase tracking-widest border-b border-[#17172A] pb-1 text-[#464555] flex items-center gap-2"><CheckSquare className="w-4 h-4 text-[#250fc2]" /> CONDITION_&_USAGE</h3>
                                            <div className="grid grid-cols-2 gap-y-2 mt-1 items-center">
                                                <span className="text-[10px] text-[#777587] font-bold">CONDITION</span>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase text-[#250fc2]">{aiResponse.condition || 'N/A'}</span>
                                                    <span className="text-[8px] md:text-[9px] uppercase text-[#777587]">CONFIDENCE: {aiResponse.conditionConfidence || 'N/A'}</span>
                                                </div>
                                                <span className="text-[10px] text-[#777587] font-bold">EST_AGE</span><span className="text-xs font-bold uppercase">{aiResponse.estimatedAge || 'N/A'}</span>
                                            </div>
                                            {(aiResponse.visibleDamage && aiResponse.visibleDamage.length > 0) && (
                                                <div className="mt-2 text-[10px] md:text-xs border border-[#17172A] border-dashed p-2 bg-white">
                                                    <span className="text-[10px] text-[#93000a] font-bold uppercase block mb-1">VISIBLE_DAMAGE:</span>
                                                    <ul className="list-disc pl-4 text-[11px]">
                                                        {aiResponse.visibleDamage.map((dmg, i) => <li key={i}>{dmg}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-[11px] md:text-sm font-bold uppercase tracking-widest border-b border-[#17172A] pb-1 text-[#464555] flex items-center gap-2"><CheckSquare className="w-4 h-4 text-[#250fc2]" /> FEATURES_&_ITEMS</h3>
                                            <div className="grid grid-cols-2 gap-2 md:gap-4 mt-1">
                                                <div>
                                                    <span className="text-[9px] md:text-[10px] text-[#777587] font-bold uppercase block mb-1">VISIBLE_FEATURES</span>
                                                    {aiResponse.visibleFeatures && aiResponse.visibleFeatures.length > 0 ? (
                                                        <ul className="list-disc pl-3 text-[9px] md:text-[10px] uppercase space-y-1">
                                                            {aiResponse.visibleFeatures.map((feat, i) => <li key={i}>{feat}</li>)}
                                                        </ul>
                                                    ) : <span className="text-[10px] text-[#17172A]">NOT_VISIBLE</span>}
                                                </div>
                                                <div>
                                                    <span className="text-[9px] md:text-[10px] text-[#777587] font-bold uppercase block mb-1">INCLUDED_ITEMS</span>
                                                    {aiResponse.includedItems && aiResponse.includedItems.length > 0 ? (
                                                        <ul className="list-disc pl-3 text-[9px] md:text-[10px] uppercase space-y-1">
                                                            {aiResponse.includedItems.map((item, i) => <li key={i}>{item}</li>)}
                                                        </ul>
                                                    ) : <span className="text-[10px] text-[#17172A]">NOT_VISIBLE</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Descriptions & Price */}
                                    <div className="flex flex-col gap-4 md:gap-6 mt-4 md:mt-0">
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-[11px] md:text-sm font-bold uppercase tracking-widest border-b border-[#17172A] pb-1 text-[#464555] flex items-center gap-2"><CheckSquare className="w-4 h-4 text-[#250fc2]" /> PRICE_ESTIMATE</h3>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] uppercase text-[#777587] font-bold">ESTIMATED_RANGE</span>
                                                    <span className="text-xs md:text-sm font-bold">₹{aiResponse.priceRange?.min} - ₹{aiResponse.priceRange?.max}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 text-right">
                                                    <span className="text-[10px] uppercase text-[#777587] font-bold">RECOMMENDED</span>
                                                    <span className="text-xl md:text-2xl font-bold text-[#250fc2]">₹{aiResponse.recommendedPrice}</span>
                                                </div>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] text-[#464555] italic leading-tight mt-1 px-2 border-l-[3px] border-[#250fc2] bg-white py-1">{aiResponse.priceReason || 'Estimated based on visible condition.'}</p>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-2 md:mt-4">
                                            <label className="text-[10px] font-bold uppercase text-[#464555]">FINAL_LISTING_PRICE (₹)</label>
                                            <input type="number" value={finalData.price} onChange={(e) => setFinalData({ ...finalData, price: e.target.value })} className="border border-[#17172A] bg-white p-2 md:p-3 text-base md:text-lg font-bold focus:outline-none focus:border-[#250fc2]" placeholder="e.g. 5000" />
                                        </div>

                                        <div className="flex flex-col gap-2 mt-2">
                                            <label className="text-[10px] font-bold uppercase text-[#464555]">SELECTED_CONDITION</label>
                                            <select value={finalData.condition} onChange={(e) => setFinalData({ ...finalData, condition: e.target.value })} className="border border-[#17172A] bg-white p-3 text-sm focus:outline-none uppercase">
                                                <option value="">-- SELECT_CONDITION --</option>
                                                <option>NEW</option>
                                                <option>LIKE_NEW</option>
                                                <option>GOOD</option>
                                                <option>FAIR</option>
                                                <option>POOR</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {aiResponse && (
                                <div className="mt-4">
                                    <h3 className="text-[11px] md:text-sm font-bold uppercase tracking-widest border-b border-[#17172A] pb-2 text-[#464555] mb-2 md:mb-4">DESCRIPTION_OPTIONS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4">
                                        {[
                                            { key: 'short35', label: 'OPTION 01 — 35 WORDS' },
                                            { key: 'medium55', label: 'OPTION 02 — 55 WORDS' },
                                            { key: 'detailed80', label: 'OPTION 03 — 80 WORDS' }
                                        ].map((opt) => (
                                            <div key={opt.key} className={`border ${finalData.description === aiResponse.descriptions[opt.key] ? 'border-[#250fc2] shadow-[4px_4px_0_#250fc2]' : 'border-[#17172A] shadow-[4px_4px_0_#17172A]'} bg-white p-3 md:p-4 flex flex-col gap-3 md:gap-4 cursor-pointer hover:-translate-y-1 hover:-translate-x-1 transition-all`} onClick={() => setFinalData({ ...finalData, description: aiResponse.descriptions[opt.key] })}>
                                                <div className="flex justify-between items-center border-b border-[#17172A] pb-2">
                                                    <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#464555]">{opt.label}</h4>
                                                    {finalData.description === aiResponse.descriptions[opt.key] && <CheckSquare className="w-4 h-4 text-[#250fc2]" />}
                                                </div>
                                                <p className="text-[10px] md:text-xs text-[#1b1b24] leading-relaxed flex-1">{aiResponse.descriptions[opt.key]}</p>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-[#250fc2] uppercase hover:underline">[USE THIS]</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2 mt-4 md:mt-6">
                                        <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#464555] flex justify-between items-end">
                                            <span>[WRITE YOUR OWN]</span>
                                            <button className="flex items-center gap-1 text-[#250fc2] hover:underline" onClick={() => setFinalData({ ...finalData, description: '' })}><Edit3 className="w-3 h-3" /> CLEAR</button>
                                        </label>
                                        <textarea
                                            className="border border-[#17172A] p-2 md:p-4 text-[11px] md:text-sm bg-white focus:outline-none focus:border-[#250fc2] min-h-[100px] md:min-h-[120px] transition-colors"
                                            value={finalData.description}
                                            onChange={(e) => setFinalData({ ...finalData, description: e.target.value })}
                                            placeholder="Enter your product description here..."
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-2 md:mt-4">
                                <button onClick={() => setStep(2)} className="border border-[#17172A] bg-white text-[#1b1b24] px-4 py-2 md:px-6 md:py-3 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#efecf9] transition-colors">BACK</button>
                                <button onClick={() => setStep(5)} className="border border-[#17172A] bg-[#250fc2] text-white px-4 py-2 md:px-6 md:py-3 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#1b1b24] transition-colors shadow-[2px_2px_0_#17172A] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[3px_3px_0_#17172A]">CONTINUE_TO_PREVIEW</button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="flex flex-col gap-4 md:gap-6 animate-fade-in">
                            <h2 className="text-lg md:text-xl font-bold uppercase">05 // PREVIEW_LISTING</h2>

                            <div className="border border-[#17172A] p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 bg-white shadow-[4px_4px_0_#17172A]">
                                <div className="w-full md:w-1/3 bg-[#f5f2ff] border border-[#17172A] p-2 md:p-4 flex items-center justify-center h-48 md:min-h-[200px]">
                                    {images.length > 0 ? (
                                        <img src={images[0]} className="w-full h-full object-contain object-center" />
                                    ) : (
                                        <span className="text-[#17172A] text-xs font-bold">[ NO_IMAGE ]</span>
                                    )}
                                </div>
                                <div className="w-full md:w-2/3 flex flex-col gap-2 md:gap-4">
                                    <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight">{aiResponse?.productName || productData.productName || 'PRODUCT_NAME'}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[9px] md:text-[11px] font-bold uppercase border border-[#17172A] px-2 py-1 bg-[#fcf8ff]">{aiResponse?.category || productData.category}</span>
                                        <span className="text-[9px] md:text-[11px] font-bold uppercase border border-[#17172A] px-2 py-1 bg-[#fcf8ff]">COND: {finalData.condition || 'UNKNOWN'}</span>
                                    </div>
                                    <div className="text-2xl md:text-3xl font-bold text-[#250fc2] mt-1 md:mt-2">₹{finalData.price || 0}</div>
                                    <p className="text-xs md:text-sm mt-2 md:mt-4 text-[#464555] leading-relaxed whitespace-pre-wrap">{finalData.description || 'No description provided.'}</p>
                                </div>
                            </div>

                            <div className="flex justify-between mt-4 md:mt-6 border-t border-[#17172A] pt-4 md:pt-6">
                                <button onClick={() => setStep(4)} className="border border-[#17172A] bg-white text-[#1b1b24] px-4 py-2 md:px-6 md:py-3 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#efecf9] transition-colors">EDIT_DETAILS</button>
                                <button onClick={handlePublish} className="border border-[#17172A] bg-[#1b1b24] text-white px-4 py-2 md:px-8 md:py-4 font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-[#250fc2] transition-colors shadow-[4px_4px_0_#17172A] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_#17172A]">
                                    PUBLISH_LISTING
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {pendingCropImage && (
                <ImageCropModal
                    imageSrc={pendingCropImage}
                    onCropComplete={(croppedBase64) => {
                        setImages([croppedBase64]);
                        setPendingCropImage(null);
                    }}
                    onClose={() => setPendingCropImage(null)}
                />
            )}
        </div>
    );
};

export default Sell;
