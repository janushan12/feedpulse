'use client';

import api from "@/lib/api";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/login", { email, password });
            localStorage.setItem('feedpulse_token', res.data.data.token);
            router.push("/dashboard");
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin login</h1>
                    <p className="text-gray-500 text-sm mt-1">FeedPulse dashboard access</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@feedpulse.com"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                            >
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>
                                ) : (
                                    "Sign in"
                                )}
                            </button>
                    </form>
                </div>
                <p className="text-center text-xs text-gray-400 mt-4">
                    Default: admin@feedpulse.com / admin123
                </p>
            </div>
        </div>
    )
}