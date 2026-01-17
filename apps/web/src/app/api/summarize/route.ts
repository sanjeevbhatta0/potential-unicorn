import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, title } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Call the AI service with a prompt that requests Nepali summary
        const response = await fetch(`${AI_SERVICE_URL}/api/v1/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                article: {
                    content: content.substring(0, 5000), // Limit content length
                    title: title || 'Article',
                },
                provider: 'claude',
                length: 'medium',
                // Custom system prompt for Nepali output
                custom_instructions: `
          Please provide the summary and key points in Nepali (नेपाली) language.
          The original article is about Nepal/Nepali news.
          Format:
          - Summary: A concise 2-3 sentence summary in Nepali
          - Key Points: 5 important points from the article in Nepali
        `,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI service error:', errorText);
            return NextResponse.json(
                {
                    error: 'Failed to generate summary',
                    summary: 'सारांश तयार गर्न सकिएन। कृपया पछि पुनः प्रयास गर्नुहोस्।',
                    key_points: [
                        'मूल लेख हेर्नुहोस्',
                        'AI सारांश अस्थायी रूपमा उपलब्ध छैन',
                    ],
                },
                { status: 200 }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            summary: data.summary,
            key_points: data.key_points || [],
            model: data.model,
            processing_time: data.processing_time,
        });
    } catch (error) {
        console.error('Error in summarize API:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                summary: 'सारांश तयार गर्न सकिएन।',
                key_points: [],
            },
            { status: 500 }
        );
    }
}
