'use client';

import api from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Loader2, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Zod validation schema
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
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
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

  // form
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
          <MessageSquarePlus className="h-4 w-4" />
          Share your feedback
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Help us build a better product!
        </h1>
        <p className="text-gray-500 text-lg">
          Your feedback is instantly analyzed by AI and sent straight to our product team. We read every single submission and use them to prioritize our roadmap.
        </p>
      </div>

      {/* error banner */}
      {submitState === 'error' && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* form card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Dark mode support for the Dashboard"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.title
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category')}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.category
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
            >
              <option value="">Select a category...</option>
              <option value="Bug">🐛 Bug</option>
              <option value="Feature Request">✨ Feature Request</option>
              <option value="Improvement">⚡ Improvement</option>
              <option value="Other">🔖 Other</option>
            </select>
            {errors.category && (
              <p className="mt-1.5 text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
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
              rows={5}
              placeholder="Describe your feedback in detail. What problem does it solve? What would the ideal solution look like? (min 20 characters)"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.description
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${descriptionCharCount >= 20 ? 'bg-green-400' : 'bg-indigo-400'
                  }`}
                style={{ width: `${Math.min((descriptionCharCount / 20) * 100, 100)}%` }}
              />
            </div>
            {descriptionCharCount < 20 && descriptionCharCount > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {20 - descriptionCharCount} more characters to go!
              </p>
            )}
          </div>
          {/* divider */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-4">
              Optional - helps us follow up with you
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your name
                </label>
                <input
                  {...register('submitterName')}
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white hover:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  {...register('submitterEmail')}
                  type="email"
                  placeholder="john.doe@example.com"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors ${errors.submitterEmail
                    ? 'border-red-400'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                />
                {errors.submitterEmail && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.submitterEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitState === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
          >
            {submitState === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Your feedback is analyzed by AI to help priorities product decisions.
          </p>
        </form>
      </div>

      {/* Info cards */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { emoji: '🤖', title: 'AI Analysed', desc: 'Every submission is instantly categorised' },
          { emoji: '⚡', title: 'Fast Review', desc: 'Team sees your feedback right away' },
          { emoji: '🔒', title: 'Private', desc: 'Your info is never shared or sold' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl mb-2">{item.emoji}</div>
            <div className="text-sm font-medium text-gray-800">{item.title}</div>
            <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}