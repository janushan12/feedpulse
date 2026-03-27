import { Request, Response, NextFunction } from "express";
import { sendError } from "./apiResponse";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    admin?: { email: string };    
}

export const protect = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 'Not authorized, No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as {
            email: string;
        };
        req.admin = decoded;
        next();
    } catch (error) {
        return sendError(res, 'Not authorized. Invalid token.', 401);
    }
}