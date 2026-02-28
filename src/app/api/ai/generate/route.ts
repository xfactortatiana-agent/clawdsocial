import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

// Generate post from prompt
export async function POST(request: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { 
      prompt, 
      tone = 'match_voice',
      length = 'medium',
      type = 'single'
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    // Get user's past posts for brand voice training
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    let brandVoiceExamples = ''
    let writingPatterns = ''
    
    if (user) {
      const pastPosts = await prisma.post.findMany({
        where: { 
          createdById: user.id,
          status: 'PUBLISHED'
        },
        orderBy: { publishedAt: 'desc' },
        take: 20
      })
      
      if (pastPosts.length > 0) {
        // Analyze patterns
        const avgLength = pastPosts.reduce((sum, p) => sum + p.content.length, 0) / pastPosts.length
        const usesEmojis = pastPosts.filter(p => /[\u{1F300}-\u{1F9FF}]/u.test(p.content)).length / pastPosts.length
        const usesHashtags = pastPosts.filter(p => p.content.includes('#')).length / pastPosts.length
        const questionRate = pastPosts.filter(p => p.content.includes('?')).length / pastPosts.length
        
        writingPatterns = `
WRITING PATTERN ANALYSIS:
- Average post length: ${Math.round(avgLength)} characters
- Uses emojis: ${(usesEmojis * 100).toFixed(0)}% of posts
- Uses hashtags: ${(usesHashtags * 100).toFixed(0)}% of posts  
- Asks questions: ${(questionRate * 100).toFixed(0)}% of posts
`
        
        brandVoiceExamples = `
EXACT POSTS FROM THIS ACCOUNT (match this style exactly):
${pastPosts.map((p, i) => `${i + 1}. "${p.content}"`).join('\n')}
`
      }
    }

    const lengthGuide = {
      short: 'Under 100 characters - punchy, direct',
      medium: '100-200 characters - concise but complete thought',
      long: '200-280 characters - max length, detailed but still punchy'
    }

    const systemPrompt = `You are an elite social media strategist who has studied the world's best copywriters and marketers.

Your job: Write content that sounds EXACTLY like the account owner — not generic AI slop.

${writingPatterns}
${brandVoiceExamples}

CRITICAL RULES:
1. MATCH THE EXACT VOICE from the examples above — same vocabulary, same sentence structure, same energy
2. NO generic corporate speak, NO buzzwords like "leverage," "synergy," "game-changer," "innovative solution"
3. HARD LIMIT: ${lengthGuide[length as keyof typeof lengthGuide]} — count characters and stay under limit
4. Use emojis ONLY if the examples above use them (currently ${writingPatterns.includes('Uses emojis: 0%') ? 'NEVER use emojis' : 'use sparingly like examples'})
5. Use hashtags ONLY if the examples above use them
6. Write like a human who actually cares — not a marketing bot
7. Be specific, not vague. Concrete details beat abstract concepts
8. If examples are witty, be witty. If dry, be dry. If aggressive, be aggressive.

Your output should be indistinguishable from the account owner's actual writing.`

    const userPrompt = type === 'thread' 
      ? `Write a Twitter thread about: ${prompt}\n\nEach tweet must be under 280 characters. Match the voice from the examples above perfectly. Number each tweet (1/, 2/, etc.).`
      : `Write a social media post about: ${prompt}\n\nSTAY UNDER 280 CHARACTERS. Match the voice from the examples above perfectly.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: type === 'thread' ? 2000 : 400
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', JSON.stringify(errorData, null, 2))
      return NextResponse.json({ 
        error: 'AI generation failed', 
        details: errorData.error?.message || response.statusText 
      }, { status: 500 })
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content || ''

    // Parse thread if needed
    let result
    if (type === 'thread') {
      const tweets = generatedContent
        .split(/\n?\d+\/\s*/)
        .filter((t: string) => t.trim())
        .map((t: string) => t.trim())
      
      result = { type: 'thread', tweets }
    } else {
      // Ensure single post is under 280
      const cleanContent = generatedContent.trim()
      const finalContent = cleanContent.length > 280 
        ? cleanContent.slice(0, 277) + '...'
        : cleanContent
      
      result = { type: 'single', content: finalContent }
    }

    return NextResponse.json({ 
      success: true, 
      result,
      prompt,
      tone,
      length
    })

  } catch (err) {
    console.error('AI generation error:', err)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Generate from URL
export async function PUT(request: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Get user's past posts for voice matching
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    let brandVoiceExamples = ''
    if (user) {
      const pastPosts = await prisma.post.findMany({
        where: { 
          createdById: user.id,
          status: 'PUBLISHED'
        },
        orderBy: { publishedAt: 'desc' },
        take: 10
      })
      
      if (pastPosts.length > 0) {
        brandVoiceExamples = pastPosts.map((p, i) => `${i + 1}. "${p.content}"`).join('\n')
      }
    }

    // Fetch the URL content
    const pageResponse = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' }
    })
    
    if (!pageResponse.ok) {
      return NextResponse.json({ error: 'Could not fetch URL' }, { status: 400 })
    }

    const html = await pageResponse.text()
    
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : ''
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1] : ''

    const systemPrompt = `You are an elite social media strategist.

${brandVoiceExamples ? `MATCH THIS VOICE EXACTLY:\n${brandVoiceExamples}\n\n` : ''}
CRITICAL RULES:
1. HARD LIMIT: Under 280 characters
2. NO generic corporate speak, NO buzzwords
3. Match the voice from examples above (if provided)
4. Be specific and concrete
5. Use emojis sparingly or not at all`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Title: ${title}\n\nDescription: ${description}\n\nWrite an engaging social media post about this content. Under 280 characters.` }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json({ 
        error: 'AI generation failed',
        details: errorData.error?.message 
      }, { status: 500 })
    }

    const data = await response.json()
    let generatedContent = data.choices[0]?.message?.content?.trim() || ''
    
    // Enforce 280 char limit
    if (generatedContent.length > 280) {
      generatedContent = generatedContent.slice(0, 277) + '...'
    }

    return NextResponse.json({ 
      success: true, 
      result: { type: 'single', content: generatedContent },
      source: { title, url }
    })

  } catch (err) {
    console.error('URL generation error:', err)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
