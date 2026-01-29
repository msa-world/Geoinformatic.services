import React from 'react';
import { useJobAlerts } from './job-alert-context';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobAlertToggleProps {
    variant?: 'default' | 'outline' | 'ghost' | 'sidebar';
    className?: string;
    showLabel?: boolean;
}

export function JobAlertToggle({ variant = 'default', className, showLabel = true }: JobAlertToggleProps) {
    const { isAlertEnabled, toggleAlert } = useJobAlerts();

    if (variant === 'sidebar') {
        return (
            <div
                onClick={toggleAlert}
                className={`flex items-center gap-3 w-full p-2 rounded-lg cursor-pointer transition-colors ${isAlertEnabled ? 'bg-[#D97D25]/10 text-[#D97D25]' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                {isAlertEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                <span className="font-medium">Job Alerts {isAlertEnabled ? 'On' : 'Off'}</span>
            </div>
        );
    }

    // Floating / Standard Button
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleAlert}
            layout
            className={`${className} relative flex items-center justify-center overflow-hidden transition-all duration-300 ${isAlertEnabled
                ? 'bg-[#D97D25] text-white shadow-[#D97D25]/30'
                : 'bg-white text-gray-400 border border-gray-200 shadow-gray-200'
                } ${showLabel ? 'px-6' : 'w-14 h-14 rounded-full'}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={isAlertEnabled ? 'on' : 'off'}
                    initial={{ y: -20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 45 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center justify-center"
                >
                    {isAlertEnabled ? (
                        <Bell className="w-6 h-6 fill-current" />
                    ) : (
                        <BellOff className="w-6 h-6" />
                    )}
                </motion.div>
            </AnimatePresence>

            {showLabel && (
                <motion.span
                    layout
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    className="ml-2 font-bold whitespace-nowrap"
                >
                    {isAlertEnabled ? "Alerts On" : "Get Job Alerts"}
                </motion.span>
            )}

            {/* iOS-style Pulse Effect when active */}
            {isAlertEnabled && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-white/30"
                />
            )}
        </motion.button>
    );
}
