import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// GET /api/media - List all media assets for workspace
export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    const where: any = { workspaceId }
    if (type) where.type = type.toUpperCase()
    if (tag) where.tags = { has: tag }

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Media fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}

// POST /api/media - Upload new media asset
export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, name, url, type, size, width, height, tags } = body

    if (!workspaceId || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        workspaceId,
        name: name || 'Untitled',
        url,
        type: type || 'IMAGE',
        size: size || 0,
        width,
        height,
        tags: tags || [],
        uploadedById: userId
      }
    })

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 })
  }
}
