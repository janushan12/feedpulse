'use client';

import CategoryBadge from "@/components/CategoryBadge";
import SentimentBadge from "@/components/SentimentBadge";
import api from "@/lib/api";
import { Feedback, PaginatedFeedback } from "@/lib/types";
import { ChevronLeft, ChevronRight, LogOut, RefreshCw, RotateCcw, Search, Sparkles, Trash2, MessageSquare, AlertCircle, CheckCircle, Clock, TrendingUp, Tag, X, Filter } from "lucide-react";
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

const priorityColor = (p?: number) => {
    if (!p) return 'text-gray-300';
    if (p >= 8) return 'text-red-500';
    if (p >= 5) return 'text-orange-400';
    return 'text-green-500';
}

const priorityBg = (p?: number) => {
    if (!p) return 'bg-gray-100';
    if (p >= 8) return 'bg-red-50 border border-red-200';
    if (p >= 5) return 'bg-orange-50 border border-orange-200';
    return 'bg-green-50 border border-green-200';
}

export default function DashboardPage() {
    const router = useRouter();

    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('All');
    const [sort, setSort] = useState('-createdAt');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        resolved: 0,
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
                '/feedback', { params }
            );

            const data = res.data.data;
            setFeedbackList(data.feedback);
            setTotalPages(data.pagination.pages);
            setTotal(data.pagination.total);

            const allRes = await api.get<{ success: boolean; data: PaginatedFeedback }>(
                '/feedback', { params: { limit: 1000 } }
            );
            const all = allRes.data.data.feedback;
            const open = all.filter((f) => f.status === 'New' || f.status === 'In_Review').length;
            const resolved = all.filter((f) => f.status === 'Resolved').length;
            const withPriority = all.filter((f) => f.ai_priority);
            const avgPriority =
                withPriority.length > 0
                    ? withPriority.reduce((s, f) => s + (f.ai_priority || 0), 0) / withPriority.length
                    : 0;
            const tagMap: Record<string, number> = {};
            all.forEach((f) => f.ai_tags?.forEach((t) => { tagMap[t] = (tagMap[t] || 0) + 1; }));
            const topTag = Object.entries(tagMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

            setStats({ total: all.length, open, resolved, avgPriority, topTag });
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
        setDeletingId(id);
        try {
            await api.delete(`/feedback/${id}`);
            fetchFeedback();
        } catch {
            alert('Failed to delete. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const reanalyze = async (id: string) => {
        setReanalyzingId(id);
        try {
            await api.post(`/feedback/${id}/reanalyze`);
            fetchFeedback();
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            alert(axiosError.response?.data?.message || 'AI reanalysis failed. Check your Gemini API key.');
        } finally {
            setReanalyzingId(null);
        }
    }

    const loadSummary = async () => {
        setSummaryLoading(true);
        setSummaryOpen(true);
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

    const clearSearch = () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
    }

    const activeFilters = [
        category !== 'All' && category,
        status !== 'All' && status,
        search && `"${search}"`,
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Manage and review all product feedback
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadSummary}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Sparkles className="h-4 w-4" />
                            AI Summary
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-400">Total</p>
                        </div>
                    </div>

                    <div className="ng-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                            <p className="text-xs text-gray-400">Open</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                            <p className="text-xs text-gray-400">Resolved</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.avgPriority ? stats.avgPriority.toFixed(1) : '-'}
                            </p>
                            <p className="text-xs text-gray-400">Avg Priority</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                            <Tag className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-gray-900 truncate">{stats.topTag}</p>
                            <p className="text-xs text-gray-400">Top Tag</p>
                        </div>
                    </div>
                </div>

                {summaryOpen && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                                <span className="text-sm font-semibold text-indigo-800">
                                    AI Weekly Summary
                                </span>
                            </div>
                            <button
                                onClick={() => setSummaryOpen(false)}
                                className="text-gray-400 hover:text-gray-600 shring-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {summaryLoading ? (
                            <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Generating insights...
                            </div>
                        ) : (
                            <p className="text-sm text-indigo-700 leading-relaxed">{summary}</p>
                        )}
                        {!summaryLoading && (
                            <button
                                onClick={loadSummary}
                                className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Regenerate
                            </button>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">

                        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-56">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search title or summary..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                                Search
                            </button>
                        </form>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="h-4 w-4 text-gray-400 shrink-0" />

                            <select
                                value={category}
                                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none bg-white"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none bg-white"
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
                                ))}
                            </select>

                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none bg-white"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {activeFilters.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">Active filters:</span>
                            {activeFilters.map((f) => (
                                <span
                                    key={String(f)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                                >
                                    {String(f)}
                                </span>
                            ))}
                            <button
                                onClick={() => {
                                    setCategory('All');
                                    setStatus('All');
                                    clearSearch();
                                }}
                                className="text-xs text-red-500 hover:text-red-700 ml-1"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-700">
                            {loading ? 'Loading...' : `${total} results${total !== 1 ? 's' : ''}`}
                        </p>
                        <button
                            onClick={() => fetchFeedback()}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <RefreshCw className="h-6 w-6 animate-spin mb-3" />
                            <p className="text-sm">Loading feedback...</p>
                        </div>
                    ) : feedbackList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <AlertCircle className="h-10 w-10 text-gray-300 mb-3" />
                            <p className="text-sm font-medium text-gray-500">No feedback found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Try adjusting your filters or search term
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Feedback
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Sentiment
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {feedbackList.map((item) => (
                                        <tr
                                            key={item._id}
                                            className="hover:bg-gray-50/80 transition-colors group"
                                        >
                                            <td className="px-5 py-4 max-w-xs">
                                                <p className="font-semibold text-gray-900 text-sm truncate">
                                                    {item.title}
                                                </p>
                                                {item.ai_summary && (
                                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                                        {item.ai_summary}
                                                    </p>
                                                )}
                                                {item.ai_tags && item.ai_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {item.ai_tags.slice(0, 3).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <CategoryBadge category={item.category} />
                                            </td>

                                            <td className="px-4 py-4">
                                                <SentimentBadge sentiment={item.ai_sentiment} />
                                            </td>

                                            <td className="px-4 py-4">
                                                {item.ai_priority ? (
                                                    <span
                                                        className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${priorityBg(item.ai_priority)} ${priorityColor(item.ai_priority)}`}
                                                    >
                                                        {item.ai_priority}/10
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-sm">-</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4">
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => updateStatus(item._id, e.target.value)}
                                                    className={`text-xs font-medium rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${item.status === 'New'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : item.status === 'In_Review'
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                            : 'bg-green-50 text-green-700 border-green-200'
                                                        }`}
                                                >
                                                    <option value="New">New</option>
                                                    <option value="In_Review">In Review</option>
                                                    <option value="Resolved">Resolved</option>
                                                </select>
                                            </td>

                                            <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(item.createdAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => reanalyze(item._id)}
                                                        disabled={reanalyzingId === item._id}
                                                        title="Re-run AI Analysis"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                                    >
                                                        <RotateCcw className={`h-3.5 w-3.5 ${reanalyzingId === item._id ? 'animate-spin' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteFeedback(item._id)}
                                                        disabled={deletingId === item._id}
                                                        title="Delete"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                            <p className="text-xs text-gray-400">
                                Page {page} of {totalPages} . {total} total items
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}