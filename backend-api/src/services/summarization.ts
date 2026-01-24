import axios from 'axios';
import { z } from 'zod';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

const SummaryResponseSchema = z.object({
  short: z.string(),
  detailed: z.string(),
  bulletPoints: z.array(z.string()),
  keyDecisions: z.array(z.string()),
  actionItems: z.array(z.string()),
  topics: z.array(z.object({
    name: z.string(),
    description: z.string(),
    timestamps: z.array(z.object({
      startMs: z.number(),
      endMs: z.number(),
    })).optional(),
  })),
  evidence: z.array(z.object({
    quote: z.string().max(15),
    context: z.string(),
  })),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

export async function generateSummary(
  transcript: string,
  segments: Array<{ startMs: number; endMs: number; text: string }>,
  metadata?: { title?: string; duration?: number }
): Promise<SummaryResponse> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  // Build topic timestamps from segments
  const segmentText = segments.map((seg, idx) => 
    `[${Math.floor(seg.startMs / 1000)}s-${Math.floor(seg.endMs / 1000)}s] ${seg.text}`
  ).join('\n');

  const prompt = `You are analyzing a classroom transcript. Generate a structured summary following these rules:

CRITICAL RULES:
1. DO NOT hallucinate or add information not present in the transcript.
2. All content must be directly derived from the transcript text.
3. Evidence quotes must be exact snippets from the transcript (max 15 words each).
4. Topics should map to actual content discussed, with approximate timestamps if possible.

TRANSCRIPT:
${transcript}

SEGMENTED TRANSCRIPT WITH TIMESTAMPS:
${segmentText}

METADATA:
- Title: ${metadata?.title || 'Class Session'}
- Duration: ${metadata?.duration ? `${Math.floor(metadata.duration / 60)} minutes` : 'Unknown'}

Generate a JSON response with this exact structure:
{
  "short": "A 5-line executive summary of the class session",
  "detailed": "A comprehensive paragraph summary covering all major points discussed",
  "bulletPoints": ["Key point 1", "Key point 2", ...],
  "keyDecisions": ["Decision 1", "Decision 2", ...],
  "actionItems": ["Action 1", "Action 2", ...],
  "topics": [
    {
      "name": "Topic name",
      "description": "Brief description",
      "timestamps": [{"startMs": 120000, "endMs": 180000}]
    }
  ],
  "evidence": [
    {
      "quote": "Exact quote from transcript (max 15 words)",
      "context": "What this quote demonstrates"
    }
  ]
}

IMPORTANT:
- All quotes in "evidence" must be exact text from the transcript (max 15 words).
- Topics should have timestamps derived from segment indices if relevant.
- Do not include topics that are not clearly discussed in the transcript.
- Action items and decisions must be explicitly stated or clearly implied in the transcript.`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates structured summaries from transcripts. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Perplexity API');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```\n?$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    return SummaryResponseSchema.parse(parsed);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid summary format: ${error.message}`);
    }
    if (axios.isAxiosError(error)) {
      throw new Error(`Perplexity API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}
