import React from 'react';
import { UserPlus, Search, MessageCircle, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
    { id: '01', title: 'Create Account', text: 'Join using your college identity.', icon: UserPlus },
    { id: '02', title: 'Find or List', text: 'Search for something you need or list an item.', icon: Search },
    { id: '03', title: 'Connect', text: 'Chat directly with students and discuss.', icon: MessageCircle },
    { id: '04', title: 'Buy or Sell', text: 'Complete the transaction safely on campus.', icon: ShoppingCart },
];

const HowItWorks = () => {
    return (
        <div className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">How It Works</h2>
                    <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                        A simple, secure, and smart way to buy and sell on campus.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="relative relative group bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all"
                        >
                            <div className="text-6xl font-black text-gray-50 dark:text-gray-950 absolute top-4 right-6 pointer-events-none group-hover:text-blue-50 dark:group-hover:text-blue-900/10 transition-colors">
                                {step.id}
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                                <step.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 relative z-10">{step.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 relative z-10">{step.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
