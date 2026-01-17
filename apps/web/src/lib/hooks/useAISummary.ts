'use client';

import { useState, useEffect } from 'react';

interface AISummaryResult {
    summary: string;
    key_points: string[];
    isLoading: boolean;
    error: string | null;
}

const AI_SERVICE_URL = 'http://localhost:8000';

export function useAISummary(articleContent: string, articleTitle: string) {
    const [result, setResult] = useState<AISummaryResult>({
        summary: '',
        key_points: [],
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        if (!articleContent) {
            setResult(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const fetchSummary = async () => {
            try {
                setResult(prev => ({ ...prev, isLoading: true, error: null }));

                const response = await fetch(`${AI_SERVICE_URL}/api/v1/summarize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        article: {
                            content: articleContent.substring(0, 3000), // Limit content length
                            title: articleTitle,
                        },
                        provider: 'claude',
                        length: 'medium',
                    }),
                });

                if (!response.ok) {
                    throw new Error(`AI service error: ${response.status}`);
                }

                const data = await response.json();

                setResult({
                    summary: data.summary || '',
                    key_points: data.key_points || [],
                    isLoading: false,
                    error: null,
                });
            } catch (err) {
                console.error('Error fetching AI summary:', err);
                setResult(prev => ({
                    ...prev,
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'Failed to generate summary',
                }));
            }
        };

        fetchSummary();
    }, [articleContent, articleTitle]);

    return result;
}

// Function to translate summary to Nepali
export async function translateToNepali(text: string): Promise<string> {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api/v1/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: text,
                target_language: 'ne', // Nepali - but API might not support it, so we'll handle in summary prompt
                provider: 'claude',
            }),
        });

        if (!response.ok) {
            return text; // Return original if translation fails
        }

        const data = await response.json();
        return data.translated_content || text;
    } catch {
        return text;
    }
}
