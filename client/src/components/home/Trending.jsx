import React from 'react';
import ProductCard from '../ProductCard';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Placeholder static data for UI
const mockProducts = [
    { id: 1, title: 'HP Pavilion 14 - 11th Gen Core i5', price: 32000, condition: 'Good Condition', category: 'Laptops', seller: 'Rahul S.', college: 'IIT BHU', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80' },
    { id: 2, title: 'Engineering Mathematics (Kreyszig)', price: 450, condition: 'Like New', category: 'Books', seller: 'Aman K.', college: 'IIT BHU', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80' },
    { id: 3, title: 'Firefox Geared Cycle', price: 4500, condition: 'Fair', category: 'Cycles', seller: 'Priya M.', college: 'IIT BHU', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&q=80' },
    { id: 4, title: 'Casio Scientific Calculator fx-991EX', price: 800, condition: 'Good Condition', category: 'Electronics', seller: 'Dev P.', college: 'IIT BHU', image: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?w=500&q=80' },
];

const Trending = () => {
    return (
        <div className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-2">Trending on Campus</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">Products students are checking out right now.</p>
                    </div>
                    <Link to="/search" className="hidden sm:flex text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium items-center">
                        View all <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mockProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                <div className="mt-8 sm:hidden flex justify-center">
                    <Link to="/search" className="text-blue-600 font-medium flex items-center bg-blue-50 px-6 py-3 rounded-full">
                        View all Trending Products <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Trending;
