import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import feedbackRoutes from './routes/feedback.routes'
import authRoutes from './routes/auth.routes'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Allow req from frontend
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

// check backend endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'FeedPulse API is running...'});
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found', data: null, error: null });
});

// DB Connection
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`FeedPulse API is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

startServer();