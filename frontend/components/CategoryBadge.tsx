type Category = 'Bug' | 'Feature Request' | 'Improvement' | 'Other';

const categoryConfig = {
    Bug: 'bg-red-50 text-red-700 border border-red-200',
    'Feature Request': 'bg-purple-50 text-purple-700 border border-purple-200',
    Improvement: 'bg-blue-50 text-blue-700 border border-blue-200',
    Other: 'bg-gray-50 text-gray-600 border border-gray-200',
}

export default function CategoryBadge({ category }: { category: Category }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${categoryConfig[category]}`}>
            {category}
        </span>
    )
}