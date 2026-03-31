type Status = 'New' | 'In_Review' | 'Resolved';

const statusConfig = {
    New: 'bg-blue-100 text-blue-800 border border-blue-200',
    'In_Review': 'bg-yellow-100 text-yelllow-800 border border-yellow-200',
    Resolved: 'bg-green-100 text-green-800 border border-green-200',
}

export default function StatusBadge({ status }: { status: Status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status]}`}>
            {status}
        </span>
    );
}