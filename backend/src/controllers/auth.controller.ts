import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../middleware/apiResponse';

// POST /api/auth/login
// Uses hardcoded admin credentials from .env
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return sendError(res, 'Email and password are required', 400);

        const isValidEmail = email === process.env.ADMIN_EMAIL;
        const isValidPassword = password === process.env.ADMIN_PASSWORD;

        if (!isValidEmail || !isValidPassword) return sendError(res, 'Invalid email or password', 401);

        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET || '',
            { expiresIn: '7d' }
        )

        return sendSuccess(res, { token, email }, 'Login successful');
    } catch (error) {
        return sendError(res, 'An error occurred during login', 500, error);
    }
}