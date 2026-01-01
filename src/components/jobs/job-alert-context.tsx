
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface JobAlertContextType {
    isAlertEnabled: boolean;
    toggleAlert: () => void;
}

const JobAlertContext = createContext<JobAlertContextType | undefined>(undefined);

export function JobAlertProvider({ children }: { children: React.ReactNode }) {
    const [isAlertEnabled, setIsAlertEnabled] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        async function loadPreference() {
            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('job_alerts_enabled')
                        .eq('id', user.id)
                        .single();

                    if (data) {
                        setIsAlertEnabled(data.job_alerts_enabled || false);
                    }
                } catch (e) {
                    console.error("Error fetching job alert preference:", e);
                }
            } else {
                const stored = localStorage.getItem('job_alerts_enabled');
                if (stored) {
                    setIsAlertEnabled(JSON.parse(stored));
                }
            }
            setIsLoaded(true);
        }
        loadPreference();
    }, [user]);

    const toggleAlert = async () => {
        const newState = !isAlertEnabled;
        setIsAlertEnabled(newState); // Optimistic update

        if (user) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ job_alerts_enabled: newState })
                    .eq('id', user.id);

                if (error) throw error;
            } catch (error) {
                console.error("Error updating job alert preference:", error);
                setIsAlertEnabled(!newState); // Revert on error
                toast.error("Failed to save preference");
                return;
            }
        } else {
            localStorage.setItem('job_alerts_enabled', JSON.stringify(newState));
        }

        if (newState) {
            toast.success("Job Alerts Enabled! You'll be notified of new openings.");
        } else {
            toast.info("Job Alerts Disabled.");
        }
    };

    if (!isLoaded) return null; // Or a loader

    return (
        <JobAlertContext.Provider value={{ isAlertEnabled, toggleAlert }}>
            {children}
        </JobAlertContext.Provider>
    );
}

export function useJobAlerts() {
    const context = useContext(JobAlertContext);
    if (context === undefined) {
        throw new Error('useJobAlerts must be used within a JobAlertProvider');
    }
    return context;
}
