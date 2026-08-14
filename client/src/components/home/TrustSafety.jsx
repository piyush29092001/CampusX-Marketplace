import React from 'react';
import { Shield, CheckCircle, MessageSquare, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    { text: 'College Verification required', icon: Shield },
    { text: 'Verified Transactions & Reviews', icon: CheckCircle },
    { text: 'Secure Peer-to-Peer Messaging', icon: MessageSquare },
    { text: 'AI-Assisted Listing Quality', icon: Bot },
];

const TrustSafety = () => {
    return (
        <div className="py-24 bg-blue-600 dark:bg-blue-900 overflow-hidden relative">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-500 dark:bg-blue-800 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-indigo-500 dark:bg-indigo-800 rounded-full blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">Built for a safer student marketplace.</h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-lg">
                            We prioritize the safety of our student community. Every feature is designed to build trust before you start buying or selling.
                        </p>

                        <div className="space-y-4">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-3 text-white">
                                    <div className="p-1.5 bg-blue-500/50 dark:bg-blue-800/50 rounded-full">
                                        <feature.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        <button className="mt-10 px-8 py-3 bg-white text-blue-600 hover:bg-gray-50 rounded-full font-bold transition-colors shadow-lg">
                            Learn about our policies
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="bg-white/10 dark:bg-gray-900/40 p-2 rounded-3xl backdrop-blur-xl border border-white/20">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden">

                                {/* Mock UI for Trust */}
                                <div className="flex items-center space-x-4 mb-6">
                                    <img src="https://ui-avatars.com/api/?name=P+S" className="w-12 h-12 rounded-full ring-2 ring-blue-500" alt="profile" />
                                    <div>
                                        <div className="flex items-center space-x-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">Priya Sharma</h4>
                                            <Shield className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <p className="text-sm text-gray-500">Verified Student • 4.9 ★ Seller</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        "I always check seller ratings before buying anything. The verified student badge makes me feel much more comfortable meeting up on campus."
                                    </p>
                                </div>

                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default TrustSafety;
