import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Generate post from prompt
export async function POST(request: Request) {
  const { userId } = auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured')
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { 
      prompt, 
      tone = 'professional',
      length = 'medium',
      includeHashtags = true,
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
        brandVoiceExamples = `\n\nHere are some examples of my writing style:\n${pastPosts.map(p => `- ${p.content.slice(0, 200)}`).join('\n')}`
      }
    }

    const lengthGuide = {
      short: '50-100 characters',
      medium: '100-200 characters', 
      long: '200-280 characters',
      thread: 'Multiple tweets, each 200-280 characters'
    }

    const toneGuide = {
      professional: 'Professional, authoritative, business-focused',
      casual: 'Casual, friendly, conversational',
      witty: 'Witty, clever, humorous with wordplay',
      inspiring: 'Inspiring, motivational, uplifting',
      educational: 'Educational, informative, teaching-focused'
    }

    const systemPrompt = `You are a social media expert who writes engaging posts for X (Twitter).

Guidelines:
- Tone: ${toneGuide[tone as keyof typeof toneGuide]}
- Length: ${lengthGuide[length as keyof typeof lengthGuide]}
- ${includeHashtags ? 'Include 2-4 relevant hashtags' : 'No hashtags needed'}
- Make it engaging and shareable
- Use emojis where appropriate
- Avoid generic corporate speak${brandVoiceExamples}`

    const userPrompt = type === 'thread' 
      ? `Write a Twitter thread about: ${prompt}\n\nBreak this into multiple connected tweets. Number each tweet (1/, 2/, etc.). Make each tweet engaging on its own while flowing as a cohesive thread.`
      : `Write a social media post about: ${prompt}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: type === 'thread' ? 2000 : 300
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
      // Split by tweet numbers (1/, 2/, etc.)
      const tweets = generatedContent
        .split(/\n?\d+\/\s*/)
        .filter((t: string) => t.trim())
        .map((t: string) => t.trim())
      
      result = { type: 'thread', tweets }
    } else {
      result = { type: 'single', content: generatedContent.trim() }
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    console.error('OpenAI API key not configured')
    return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { url, tone = 'professional' } = body

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Fetch the URL content
    const pageResponse = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' }
    })
    
    if (!pageResponse.ok) {
      return NextResponse.json({ error: 'Could not fetch URL' }, { status: 400 })
    }

    const html = await pageResponse.text()
    
    // Extract title and meta description
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : ''
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
    const description = descMatch ? descMatch[1] : ''

    const toneGuide = {
      professional: 'Professional, authoritative',
      casual: 'Casual, friendly',
      witty: 'Witty, clever',
      inspiring: 'Inspiring, motivational',
      educational: 'Educational, informative'
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert. Summarize content into an engaging X post.
Tone: ${toneGuide[tone as keyof typeof toneGuide]}
Include 2-3 relevant hashtags.
Keep it under 280 characters.`
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nDescription: ${description}\n\nCreate an engaging social media post about this content.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI error:', error)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content || ''

    return NextResponse.json({ 
      success: true, 
      result: { type: 'single', content: generatedContent.trim() },
      source: { title, url }
    })

  } catch (err) {
    console.error('URL generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
