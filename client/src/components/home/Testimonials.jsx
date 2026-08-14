import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const reviews = [
    { id: 1, text: "Sold my old cycle within two days. The AI helped me write the description and suggested a realistic price. It felt less like work.", name: "Aman", college: "IIT BHU", rating: 5 },
    { id: 2, text: "Found the exact books I needed for my third semester at almost half the new price. The seller met me right outside the library.", name: "Priya", college: "Student", rating: 5 },
    { id: 3, text: "The seller reviews made me much more comfortable buying a used laptop. I knew exactly who I was dealing with.", name: "Rahul", college: "Student", rating: 5 },
];

const Testimonials = () => {
    return (
        <div className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">Students Love the Marketplace</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">See what students have to say about buying and selling on campus.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-left flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex space-x-1 text-yellow-400 mb-6">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-6 leading-relaxed">"{review.text}"</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                                    {review.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{review.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{review.college}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Testimonials;
