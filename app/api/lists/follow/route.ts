import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const authz = req.headers.get('authorization') || ''
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : undefined
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = await verifyIdToken(token)
    const uid = decoded?.uid
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { listId } = body as { listId?: string }
    if (!listId) return NextResponse.json({ error: 'Missing listId' }, { status: 400 })

    const db = getAdminDb()
    const followRef = db.collection('lists').doc(listId).collection('followers').doc(uid)
    const doc = await followRef.get()
    if (doc.exists) {
      await followRef.delete()
      return NextResponse.json({ followed: false })
    } else {
      await followRef.set({ createdAt: new Date() })
      return NextResponse.json({ followed: true })
    }
  } catch (e) {
    console.error('POST /api/lists/follow error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authz = req.headers.get('authorization') || ''
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : undefined
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = await verifyIdToken(token)
    const uid = decoded?.uid
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const listId = searchParams.get('listId') || undefined
    if (!listId) return NextResponse.json({ error: 'Missing listId' }, { status: 400 })

    const db = getAdminDb()
    const followRef = db.collection('lists').doc(listId).collection('followers').doc(uid)
    const doc = await followRef.get()
    return NextResponse.json({ followed: doc.exists })
  } catch (e) {
    console.error('GET /api/lists/follow error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


