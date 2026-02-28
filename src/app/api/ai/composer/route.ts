import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mode, prompt, currentContent, isThread } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "generate":
        systemPrompt = `You are a social media expert who writes engaging X posts. 
Write in a natural, conversational tone. Use formatting like **bold** for emphasis and *italic* for subtle points.
Keep posts under 280 characters. Be punchy and memorable.`;
        userPrompt = `Write an X post about: ${prompt}`;
        break;

      case "improve":
        systemPrompt = `You are a social media editor. Improve the given post to make it more engaging.
Add hooks, make it punchier, use formatting (**bold**, *italic*).
Return 3 variations of the improved post.`;
        userPrompt = `Improve this post (focus on: ${prompt || "making it more engaging"}):

${currentContent}`;
        break;

      case "thread":
        systemPrompt = `Convert the given content into a thread (series of connected tweets).
Each tweet should be under 280 characters.
Number them 1/N, 2/N, etc.
Make each tweet engaging on its own but flow together.`;
        userPrompt = `Convert this to a thread: ${prompt || currentContent}`;
        break;

      case "hashtags":
        systemPrompt = `Suggest 5 relevant, trending hashtags for the given topic.
Return just the hashtags, one per line.`;
        userPrompt = `Suggest hashtags for: ${prompt || currentContent}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse response based on mode
    if (mode === "improve" || mode === "generate") {
      // Split into suggestions if multiple options provided
      const suggestions = response
        .split(/\n\n|\n(?=\d[\.\)]|\-)/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 3);
      
      return NextResponse.json({ 
        suggestions: suggestions.length > 0 ? suggestions : [response.trim()] 
      });
    }

    if (mode === "thread") {
      // Parse thread tweets
      const tweets = response
        .split(/\n/)
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+[\/\.\)]\s*/, "").trim())
        .filter(line => line.length > 0);
      
      return NextResponse.json({ suggestions: tweets });
    }

    if (mode === "hashtags") {
      const hashtags = response
        .split(/\n/)
        .map(h => h.trim())
        .filter(h => h.startsWith("#"))
        .slice(0, 5);
      
      return NextResponse.json({ suggestions: hashtags });
    }

    return NextResponse.json({ content: response.trim() });

  } catch (error) {
    console.error("AI composer error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
