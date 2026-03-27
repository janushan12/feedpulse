import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GeminiAnalysis {
    category: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    priority_score: number;
    summary: string;
    tags: string[];
}

export async function analyzeFeedback(
    title: string,
    description: string
): Promise<GeminiAnalysis | null> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyse this product feedback. Return only valid JSON with extra text, no markdown, no code blocks.
        Title: ${title}
        Description: ${description}

        Return this exact JSON structure:
        {
            "category": "Bug or Feature Request or Improvement or Other",
            "sentiment": "Positive or Neutral or Negative",
            "priority_score": 1 to 10 integer,
            "summary": "one sentence summary of the feedback",
            "tags": ["tag1", "tag2", "tag3"]
        }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

        const parsed: GeminiAnalysis = JSON.parse(cleaned);

        if (
            !parsed.category ||
            !parsed.sentiment ||
            !parsed.priority_score ||
            !parsed.summary ||
            !parsed.tags
        ) {
            throw new Error('Incomplete Gemini response');
        }
        return parsed;
    } catch (error) {
        console.error('Gemini analysis failed:', error);
        return null;
    }
}

export async function getWeeklySummary(
    feedbackList: Array<{ title: string; description: string }>
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const feedbackText = feedbackList
            .map((f, i) => `${i + 1}. Title: ${f.title}\n  Description: ${f.description}`)
            .join('\n\n');

        const prompt = `Here is product feedback from the last 7 days:\n\n${feedbackText}\n\nIdentity the top 3 themes or patterns from this feedback. Be concise and actionable. Formats as a short paragraph.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Weekly summary failed:', error);
        return 'Unable to generate summary at this time';
    }
}