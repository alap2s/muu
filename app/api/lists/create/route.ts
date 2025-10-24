import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'
import admin from 'firebase-admin'

type CreateListBody = {
  title?: string
  entries: Array<{ order: number; name: string; mapsUrl?: string; address?: string; note?: string }>
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    const decoded = await verifyIdToken(idToken)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as CreateListBody
    if (!Array.isArray(body.entries) || body.entries.length === 0) {
      return NextResponse.json({ error: 'At least one entry is required' }, { status: 400 })
    }
    if (body.entries.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 entries allowed' }, { status: 400 })
    }
    for (const e of body.entries) {
      if (!e.name?.trim()) return NextResponse.json({ error: 'Entry name is required' }, { status: 400 })
      if (!e.address && !e.mapsUrl) return NextResponse.json({ error: 'Each entry needs address or mapsUrl' }, { status: 400 })
    }

    const db = getAdminDb()
    const listsCol = db.collection('lists')
    const now = new Date()
    const docRef = await listsCol.add({
      ownerUid: decoded.uid,
      title: body.title || null,
      entries: body.entries.map(e => ({
        order: e.order,
        name: e.name,
        mapsUrl: e.mapsUrl || null,
        address: e.address || null,
        note: e.note || null,
      })),
      createdAt: now,
      updatedAt: now,
      likes: 0,
    })

    // optional: add to user doc (append list id)
    try {
      const userDoc = db.collection('users').doc(decoded.uid)
      await userDoc.set({ lists: admin.firestore.FieldValue.arrayUnion(docRef.id) }, { merge: true })
    } catch {}

    return NextResponse.json({ id: docRef.id })
  } catch (e) {
    console.error('Create list failed:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


