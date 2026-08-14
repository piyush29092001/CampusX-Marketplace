import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-950 pt-16 pb-24 lg:pt-24 lg:pb-32 transition-colors duration-300">
            {/* Background blobs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl opacity-50 -z-10 mt-[-200px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 ring-1 ring-blue-100 dark:ring-blue-800">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <span>AI-Powered Campus Marketplace</span>
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
                        Buy Smart. Sell Easy. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Student to Student.
                        </span>
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
                        Your trusted campus marketplace for books, electronics, cycles, hostel essentials and everything you need for college life.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link to="/search" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/30">
                            Browse Marketplace
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link to="/sell" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full font-semibold text-lg flex items-center justify-center transition-all shadow-sm group">
                            Sell Something
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
