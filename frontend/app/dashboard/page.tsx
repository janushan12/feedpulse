'use client';

import CategoryBadge from "@/components/CategoryBadge";
import SentimentBadge from "@/components/SentimentBadge";
import api from "@/lib/api";
import { Feedback, PaginatedFeedback } from "@/lib/types";
import { ChevronLeft, ChevronRight, LogOut, RefreshCw, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const CATEGORIES = ['All', 'Bug', 'Feature Request', 'Improvement', 'Other'];
const STATUSES = ['All', 'New', 'In_Review', 'Resolved'];
const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Newest first' },
    { value: 'createdAt', label: 'Oldest first' },
    { value: '-ai_priority', label: 'Priority (high -> low)' },
    { value: 'ai_priority', label: 'Priority (low -> high)' },
];

export default function DashboardPage() {
    const router = useRouter();

    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);

    const [category, setCategory] = useState('All');
    const [status, setSatus] = useState('All');
    const [sort, setSort] = useState('-createdAt');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        avgPriority: 0,
        topTag: '',
    });

    const fetchFeedback = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, sort, limit: 10 };
            if (category !== 'All') params.category = category;
            if (status !== 'All') params.status = status;
            if (search) params.search = search;

            const res = await api.get<{ success: boolean; data: PaginatedFeedback }>(
                '/feedback',
                { params }
            );

            const data = res.data.data;
            setFeedbackList(data.feedback);
            setTotalPages(data.pagination.pages);
            setTotal(data.pagination.total);

            const allRes = await api.get<{ success: boolean; data: PaginatedFeedback }>(
                '/feedback',
                { params: { limit: 1000 } }
            );
            const all = allRes.data.data.feedback;
            const open = all.filter((f) => f.status !== 'Resolved').length;
            const withPriority = all.filter((f) => f.ai_priority);
            const avgPriority =
                withPriority.length > 0
                    ? withPriority.reduce((s, f) => s + (f.ai_priority || 0), 0) / withPriority.length
                    : 0;
            const tagMap: Record<string, number> = {};
            all.forEach((f) => f.ai_tags?.forEach((t) => { tagMap[t] = (tagMap[t] || 0) + 1; }));
            const topTag = Object.entries(tagMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

            setStats({ total: all.length, open, avgPriority, topTag });
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [page, category, status, sort, search, router]);

    useEffect(() => {
        if (!localStorage.getItem('feedpulse_token')) {
            router.push('/login');
            return;
        }
        fetchFeedback();
    }, [fetchFeedback, router]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/feedback/${id}`, { status: newStatus });
            fetchFeedback();
        } catch {
            alert('Failed to update status. Please try again.');
        }
    };

    const deleteFeedback = async (id: string) => {
        if (!confirm('Delete this feedback? This cannot be undone.')) return;
        try {
            await api.delete(`/feedback/${id}`);
            fetchFeedback();
        } catch {
            alert('Failed to delete. Please try again.');
        }
    };

    const reanalyze = async (id: string) => {
        try {
            await api.post(`/feedback/${id}/reanalyze`);
            fetchFeedback();
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            alert(axiosError.response?.data?.message || 'AI reanalysis failed. Check your Gemini API key.');
        }
    }

    const loadSummary = async () => {
        setSummaryLoading(true);
        try {
            const res = await api.get('/feedback/summary');
            setSummary(res.data.data.summary);
        } finally {
            setSummaryLoading(false);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('feedpulse_token');
        router.push('/login');
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {total} total submissions
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <LogOut className="h-4 p-4" />
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total feedback', value: stats.total },
                    { label: 'Open items', value: stats.open },
                    { label: 'Avg. AI priority', value: stats.avgPriority ? stats.avgPriority.toFixed(1) : '—' },
                    { label: 'Top tag', value: stats.topTag },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">
                            AI Weekly Summary
                        </span>
                    </div>
                    <button
                        onClick={loadSummary}
                        disabled={summaryLoading}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                        <RefreshCw className={`h-3 w-3 ${summaryLoading ? 'animate-spin' : ''}`} />
                        {summary ? 'Refresh' : 'Generate'}
                    </button>
                </div>
                {summary && (
                    <p className="text-sm text-indigo-700 mt-3">{summary}</p>
                )}
                {!summary && (
                    <p className="text-sm text-indigo-400 mt-2">
                        Click Generate to get AI insights on the last 7 days of feedback.
                    </p>
                )}
            </div>


            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search title or summary..."
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </form>

                    <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => { setSatus(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s === 'All' ? 'All Statuses' : s}
                            </option>
                        ))}
                    </select>
                    <select
                        value={sort}
                        onChange={(e) => { setSort(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none bg-white"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-400">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Loading...
                    </div>
                ) : feedbackList.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        No feedback found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Sentiment</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {feedbackList.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="font-medium text-gray-900 truncate">{item.title}</p>
                                            {item.ai_summary && (
                                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                                    {item.ai_summary}
                                                </p>
                                            )}
                                            {item.ai_tags && item.ai_tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.ai_tags.slice(0, 3).map((tag) => (
                                                        <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <CategoryBadge category={item.category} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <SentimentBadge sentiment={item.ai_sentiment} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.ai_priority ? (
                                                <span className={`font-bold text-sm ${item.ai_priority >= 8 ? 'text-red-600' :
                                                    item.ai_priority >= 5 ? 'text-orange-500' :
                                                        'text-gray-400'
                                                    }`}>
                                                    {item.ai_priority}/10
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.status}
                                                onChange={(e) => updateStatus(item._id, e.target.value)}
                                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="New">New</option>
                                                <option value="In_Review">In Review</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => reanalyze(item._id)}
                                                    title="Re-run AI analysis"
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFeedback(item._id)}
                                                    title="Delete"
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}