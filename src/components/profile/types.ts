export interface UserProfile {
    id: string
    email: string
    full_name?: string
    role?: string
    bio?: string
    phone_number?: string
    company?: string
    location?: string
    avatar_url?: string
    updated_at?: string
    job_alerts_enabled?: boolean
    cv_url?: string
    skills?: string[]
}

export interface ProfileStepProps {
    profile: UserProfile
    setProfile: (profile: UserProfile) => void
    onNext: () => void
    onPrev: () => void
    goToStep?: (step: number) => void
    isSaving?: boolean
}

export interface Job {
    id: string
    title: string
    department: string
    location: string
    type: string
    description: string
    requirements: string
    status: 'OPEN' | 'CLOSED' | 'DELETED' | 'EXPIRED'
    created_at: string
    salary_min?: number
    salary_max?: number
    salary_currency?: string
    brand_logo_url?: string
    external_link?: string
    profiles?: {
        company?: string
        full_name?: string
        avatar_url?: string
    }
    urgently_hiring?: boolean
}

export interface JobApplication {
    id: string
    job_id: string
    user_id: string
    status: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED' | 'JOB_DELETED' | 'JOB_EXPIRED' | 'EXPIRED'
    applied_at: string
    profile?: UserProfile // For joining profile data
    job?: Job // For joining job data
}
