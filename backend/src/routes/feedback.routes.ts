import { Router } from "express";
import rateLimit from "express-rate-limit";
import { 
    createFeedback, 
    deleteFeedback, 
    getAllFeedback, 
    getFeedbackById, 
    getFeedbackSummary, 
    reanalyzeFeedback, 
    updateFeedback 
} from "../controllers/feedback.controller";
import { protect } from "../middleware/auth";

const router = Router();

// Rate limiter: max 5 requests per minute per IP
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        message: 'Too many feedback submissions from this IP, please try again after an hour.',
        data: null,
        error: 'RATE_LIMIT_EXCEEDED'
    }
})

// anyone can submit feedback without authentication
router.post('/', submitLimiter, createFeedback);

// admin only routes - require JWT token
router.get('/summary', protect, getFeedbackSummary)
router.get('/', protect, getAllFeedback);
router.get('/:id', protect, getFeedbackById);
router.patch('/:id', protect, updateFeedback);
router.delete('/:id', protect, deleteFeedback);
router.post('/:id/reanalyze', protect, reanalyzeFeedback);

export default router;