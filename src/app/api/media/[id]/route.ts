import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// DELETE /api/media/[id] - Delete a media asset
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.mediaAsset.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media delete error:', error)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}

// PATCH /api/media/[id] - Update media asset (name, tags)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, tags } = body

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tags && { tags })
      }
    })

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('Media update error:', error)
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 })
  }
}
