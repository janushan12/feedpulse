type Sentiment = 'Positive' | 'Neutral' | 'Negative' | undefined;

const sentimentConfig = {
    Positive: {
        label: 'Positive',
        className: 'bg-green-100 text-green-800 border border-green-200',
        dot: 'bg-green-500'
    },
    Neutral: {
        label: 'Neutral',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
        dot: 'bg-gray-400'
    },
    Negative: {
        label: 'Negative',
        className: 'bg-red-100 text-red-800 border border-red-200',
        dot: 'bg-red-500'
    },
}

export default function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
    if (!sentiment) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                Analysing...
            </span>
        );
    }

    const config = sentimentConfig[sentiment];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}