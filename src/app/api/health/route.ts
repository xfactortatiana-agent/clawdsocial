import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection by counting users
    const count = await prisma.user.count()
    
    return NextResponse.json({ 
      status: 'connected',
      message: 'Database connection successful',
      userCount: count
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
