import { Request, Response } from "express";
import { sendError, sendSuccess } from "../middleware/apiResponse";
import Feedback from "../models/Feedback";
import { analyzeFeedback, getWeeklySummary } from "../services/gemini.service";

// POST /api/feedback - Submit new feedback
export const createFeedback = async (req: Request, res: Response) => {
    try {
        const { title, description, category, submitterName, submitterEmail } = req.body;

        if (!title?.trim() || !description?.trim() || !category) {
            return sendError(res, 'Title, description, and category are required.', 400);
        }

        const feedback = await Feedback.create({
            title: title.trim(),
            description: description.trim(),
            category,
            submitterName: submitterName?.trim(),
            submitterEmail: submitterEmail?.trim()
        })

        analyzeFeedback(title, description).then(async (analysis) => {
            if (analysis) {
                await Feedback.findByIdAndUpdate(feedback._id, {
                    ai_category: analysis.category,
                    ai_sentiment: analysis.sentiment,
                    ai_priority: analysis.priority_score,
                    ai_summary: analysis.summary,
                    ai_tags: analysis.tags,
                    ai_processed: true,
                });
            }
        })
        return sendSuccess(res, feedback, 'Feedback submitted successfully', 201);
    } catch (error) {
        return sendError(res, 'Failed to submit feedback', 500, error)
    }
}

// GET /api/feedback - Retrieve all feedback entries
export const getAllFeedback = async (req: Request, res: Response) => {
    try {
        const {
            category,
            status,
            page = '1',
            limit = '10',
            sort = '-createdAt',
            search,
        } = req.query;

        const filter: Record<string, unknown> = {};
        if (category) filter.category = category;
        if (status) filter.status = status;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { ai_summary: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [feedbackList, total] = await Promise.all([
            Feedback.find(filter)
                .sort(sort as string)
                .skip(skip)
                .limit(limitNum),
            Feedback.countDocuments(filter),
        ]);

        return sendSuccess(res, {
            feedback: feedbackList,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        })
    } catch (error) {
        return sendError(res, 'Failed to retrieve feedback', 500, error)
    }
}

// Get /api/feedback/summary - Get AI weekly summary
export const getFeedbackSummary = async (req: Request, res: Response) => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentFeedback = await Feedback.find({
            createdAt: { $gte: oneWeekAgo },
        }).select('title description');

        if (recentFeedback.length === 0) {
            return sendSuccess(res, { summary: 'No recent feedback to summarize.' });
        }

        const summary = await getWeeklySummary(recentFeedback);
        return sendSuccess(res, { summary });
    } catch (error) {
        return sendError(res, 'Failed to generate summary', 500, error)
    }
}

// GET /api/feedback/:id - Retrieve a specific feedback entry by ID
export const getFeedbackById = async (req: Request, res: Response) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return sendError(res, 'Feedback not found', 404);
        return sendSuccess(res, feedback);
    } catch (error) {
        return sendError(res, 'Failed to retrieve feedback', 500, error)
    }
}

// PATCH /api/feedback/:id - Update feedback status (admin only)
export const updateFeedback = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const validStatuses = ['New', 'In_Review', 'Resolved'];

        if (!validStatuses.includes(status)) {
            return sendError(res, `Invalid status. Valid options are: ${validStatuses.join(', ')}`, 400);
        }

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )

        if (!feedback) return sendError(res, 'Feedback not found', 404);
        return sendSuccess(res, feedback, 'Feedback status updated successfully');
    } catch (error) {
        return sendError(res, 'Failed to update feedback', 500, error)
    }
}

// DELETE /api/feedback/:id - Delete a feedback entry (admin only)
export const deleteFeedback = async (req: Request, res: Response) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) return sendError(res, 'Feedback not found', 404);
        return sendSuccess(res, null, 'Feedback deleted successfully');
    } catch (error) {
        return sendError(res, 'Failed to delete feedback', 500, error)
    }
}

// POST /api/feedback/:id/reanalyze - Re-trigger AI analysis (admin only)
export const reanalyzeFeedback = async (req: Request, res: Response) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return sendError(res, 'Feedback not found', 404);

        const analysis = await analyzeFeedback(feedback.title, feedback.description);

        if (!analysis) return sendError(res, 'AI analysis failed. Please try again.', 500)

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            feedback._id,
            {
                ai_category: analysis.category,
                ai_sentiment: analysis.sentiment,
                ai_priority: analysis.priority_score,
                ai_summary: analysis.summary,
                ai_tags: analysis.tags,
                ai_processed: true,
            },
            { new: true }
        )

        return sendSuccess(res, updatedFeedback, 'Feedback re-analyzed successfully');
    } catch (error) {
        return sendError(res, 'Failed to re-analyze feedback', 500, error)
    }
}