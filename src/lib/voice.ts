import { prisma } from "./db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VoiceProfile {
  userId: string;
  tone: string;
  style: string;
  commonPhrases: string[];
  emojiUsage: 'high' | 'medium' | 'low';
  sentenceLength: 'short' | 'medium' | 'long';
  questionFrequency: number;
  audience: string;
  topics: string[];
}

export async function analyzeBrandVoice(userId: string): Promise<VoiceProfile | null> {
  // Get user's last 50 posts
  const posts = await prisma.post.findMany({
    where: {
      createdById: userId,
      status: 'PUBLISHED'
    },
    orderBy: { publishedAt: 'desc' },
    take: 50
  });

  if (posts.length < 5) {
    return null; // Not enough data
  }

  const content = posts.map(p => p.content).join('\n\n');

  // Use AI to analyze voice
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Analyze this user's writing style and return a JSON object with:
        - tone: (professional, casual, witty, educational, inspirational, etc.)
        - style: (concise, detailed, story-driven, list-based, etc.)
        - commonPhrases: array of 3-5 phrases they use often
        - emojiUsage: (high, medium, low)
        - sentenceLength: (short, medium, long)
        - questionFrequency: number 0-1 (how often they ask questions)
        - audience: who they seem to be speaking to (founders, developers, general, etc.)
        - topics: array of 3-5 main topics they write about`
      },
      {
        role: "user",
        content: `Analyze these posts:\n\n${content}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

  // Save to database
  await prisma.user.update({
    where: { id: userId },
    data: {
      voiceProfile: JSON.stringify(analysis),
      voiceProfileUpdatedAt: new Date()
    }
  });

  return {
    userId,
    ...analysis
  };
}

export async function getVoiceProfile(userId: string): Promise<VoiceProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user?.voiceProfile) {
    // Analyze if not exists
    return analyzeBrandVoice(userId);
  }

  return JSON.parse(user.voiceProfile);
}

export function generateVoicePrompt(profile: VoiceProfile | null): string {
  if (!profile) {
    return "Write in a natural, engaging social media style.";
  }

  return `Write in this specific voice:
- Tone: ${profile.tone}
- Style: ${profile.style}
- Audience: ${profile.audience}
- Use ${profile.emojiUsage} emoji usage
- Keep sentences ${profile.sentenceLength}
- Ask questions ${Math.round(profile.questionFrequency * 100)}% of the time
- Common phrases to use naturally: ${profile.commonPhrases.join(', ')}
- Focus on topics: ${profile.topics.join(', ')}

Match this voice exactly. The user should not be able to tell it was AI-generated.`;
}

// Check if voice profile needs refresh (monthly)
export async function shouldRefreshVoiceProfile(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { voiceProfileUpdatedAt: true }
  });

  if (!user?.voiceProfileUpdatedAt) return true;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return user.voiceProfileUpdatedAt < oneMonthAgo;
}
