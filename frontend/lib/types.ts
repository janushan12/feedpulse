export interface Feedback {
    _id: string;
    title: string;
    description: string;
    category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
    status: 'New' | 'In_Review' | 'Resolved';
    submitterName?: string;
    submitterEmail?: string;
    ai_category?: string;
    ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
    ai_priority?: number;
    ai_summary?: string;
    ai_tags?: string[];
    ai_processed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    error: string | null;
}

export interface PaginatedFeedback {
    feedback: Feedback[];
    pagination: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    }
}