import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '../../../lib/firebaseAdmin'

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    const snap = await db.collection('lists').orderBy('createdAt', 'desc').limit(50).get()
    const raw = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
    // Fetch owner display names
    const ownerUids = Array.from(new Set(raw.map(l => l.ownerUid).filter(Boolean))) as string[]
    const ownerMap = new Map<string, { displayName: string | null }>()
    await Promise.all(ownerUids.map(async uid => {
      try {
        const u = await db.collection('users').doc(uid).get()
        ownerMap.set(uid, { displayName: (u.data() as any)?.displayName ?? null })
      } catch {
        ownerMap.set(uid, { displayName: null })
      }
    }))
    const lists = await Promise.all(raw.map(async (l) => ({
      id: l.id,
      ownerUid: l.ownerUid,
      ownerName: ownerMap.get(l.ownerUid)?.displayName ?? null,
      title: l.title ?? null,
      entries: Array.isArray(l.entries) ? l.entries : [],
      likes: typeof l.likes === 'number' ? l.likes : 0,
      followers: await db.collection('lists').doc(l.id).collection('followers').count().get().then(r => r.data().count).catch(() => 0),
      createdAt: l.createdAt ?? null,
      updatedAt: l.updatedAt ?? null,
    })))
    return NextResponse.json({ lists })
  } catch (e) {
    console.error('Fetch lists failed:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


