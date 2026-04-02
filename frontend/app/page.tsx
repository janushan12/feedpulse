'use client';

import api from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Loader2, MessageSquarePlus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const feedbackSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(120, 'Title must be less than 120 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters long')
    .max(2000, 'Description is too long'),
  category: z
    .string()
    .refine((val) => ['Bug', 'Feature Request', 'Improvement', 'Other'].includes(val), {
      message: 'Please select a valid category',
    }),
  submitterName: z.string().optional(),
  submitterEmail: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')), // Allow empty string for optional email
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

// Main component
export default function Home() {
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema)
  })

  // show charcter count for description
  const descriptionValue = watch('description', '');
  const descriptionCharCount = descriptionValue?.length || 0;

  const onSubmit = async (data: FeedbackFormData) => {
    setSubmitState('loading');
    setErrorMessage('');

    try {
      await api.post('/feedback', data);
      setSubmitState('success');
      reset();
    } catch (err: unknown) {
      setSubmitState('error');
      const axiosError = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        axiosError.response?.data?.message || 'Something went wrong. Please try again later.'
      )
    }
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanks for your feedback!
          </h2>
          <p className="text-gray-500 mb-6">
            Our AI is analysing your submission now. The product team will review it shortly.
          </p>
          <button
            onClick={() => setSubmitState('idle')}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-stretch">
      <div className="hidden lg:flex lg:w-5/12 bg-indigo-600 flex-col justify-between p-10 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full -translate-y-32 translate-x-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-700 rounded-full translate-y-24 -translate-x-24 opacity-50" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1.5 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Feedback
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Help us build a<br /> better product!
          </h1>
          <p className="text-indigo-100 text-base leading-relaxed">
            Your feedback is instantly analyzed by AI and sent straight to our product team. We read every single submission and use them to prioritize our roadmap.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            {
              emoji: '🤖',
              title: 'AI Analysed',
              desc: 'Every submission is instantly categorised and prioritised',
            },
            {
              emoji: '⚡',
              title: 'Fast Review',
              desc: 'Your feedback reaches the team immediately',
            },
            {
              emoji: '🔒',
              title: 'Private & Safe',
              desc: 'Your information is never shared or sold',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm"
            >
              <span className="text-xl mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-white font-medium text-sm">{item.title}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">

          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Share your feedback</h1>
            <p className="text-gray-500 text-sm mt-1">
              Help us build a better product
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit feedback</h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill in the form below — takes less than 2 minutes
            </p>
          </div>

          {/* error banner */}
          {submitState === 'error' && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Title + Category side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    placeholder="Brief title..."
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.title
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors ${errors.category
                      ? 'border-red-400'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <option value="">Select...</option>
                    <option value="Bug">🐛 Bug</option>
                    <option value="Feature Request">✨ Feature Request</option>
                    <option value="Improvement">📈 Improvement</option>
                    <option value="Other">💬 Other</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs tabular-nums ${descriptionCharCount < 20
                      ? 'text-red-500'
                      : descriptionCharCount > 1800
                        ? 'text-orange-500'
                        : 'text-gray-400'
                      }`}
                  >
                    {descriptionCharCount} / 2000
                  </span>
                </div>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe your feedback in detail. What problem does it solve? (min. 20 characters)"
                  className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${errors.description
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
                {/* Progress bar */}
                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${descriptionCharCount >= 20 ? 'bg-green-400' : 'bg-indigo-400'
                      }`}
                    style={{ width: `${Math.min((descriptionCharCount / 20) * 100, 100)}%` }}
                  />
                </div>
                {descriptionCharCount < 20 && descriptionCharCount > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    {20 - descriptionCharCount} more characters needed
                  </p>
                )}
              </div>

              {/* Name + Email side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your name
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    {...register('submitterName')}
                    type="text"
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white hover:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    {...register('submitterEmail')}
                    type="email"
                    placeholder="jane@example.com"
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors ${errors.submitterEmail
                      ? 'border-red-400'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                  />
                  {errors.submitterEmail && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.submitterEmail.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm mt-2"
              >
                {submitState === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Submit feedback
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Analysed by AI · Never shared · Read by the team
          </p>
        </div>
      </div>
    </div>
  )
}