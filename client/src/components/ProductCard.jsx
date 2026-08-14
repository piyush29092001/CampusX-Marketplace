import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

const ProductCard = ({ product }) => {
    return (
        <div className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative h-[240px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm z-10">
                    <Heart className="w-5 h-5" />
                </button>
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm backdrop-blur-sm">
                    {product.condition}
                </div>
            </div>

            <div className="p-4">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{product.category}</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1 truncate">{product.title}</h3>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price.toLocaleString()}</span>
                </div>

                {/* AI Insight Badge */}
                <div className="flex items-center space-x-1.5 px-2 py-1 mb-4 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>AI Fair Price: ₹{Math.floor(product.price * 0.9).toLocaleString()}–₹{Math.floor(product.price * 1.1).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-2">
                        <img src={`https://ui-avatars.com/api/?name=${product.seller}`} alt="seller" className="w-6 h-6 rounded-full" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{product.seller}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">{product.college}</span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
