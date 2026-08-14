import React from 'react';
import { Users, ShoppingBag, CheckCircle, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
    { id: 1, name: 'Students Joined', value: '2,481+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 2, name: 'Active Listings', value: '1,240+', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { id: 3, name: 'Items Sold', value: '3,820+', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 4, name: 'Colleges', value: '12', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
];

const Stats = () => {
    return (
        <div className="bg-white dark:bg-gray-950 py-8 border-y border-gray-100 dark:border-gray-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                            <div className={`p-3 rounded-full ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color} dark:brightness-125`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Stats;
