import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getAdminDb()
    const { id } = params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const doc = await db.collection('lists').doc(id).get()
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const list = { id: doc.id, ...(doc.data() as any) }
    const followers = await db.collection('lists').doc(id).collection('followers').count().get().then(r => r.data().count).catch(() => 0)
    let ownerName: string | null = null
    if (list.ownerUid) {
      const userDoc = await db.collection('users').doc(list.ownerUid).get()
      ownerName = (userDoc.data() as any)?.displayName ?? null
    }
    return NextResponse.json({ list: { ...list, ownerName, followers } })
  } catch (e) {
    console.error('GET /api/lists/[id] error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authz = req.headers.get('authorization') || ''
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : undefined
    const decoded = await verifyIdToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getAdminDb()
    const { id } = params
    const docRef = db.collection('lists').doc(id)
    const snap = await docRef.get()
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const data = snap.data() as any
    if (data.ownerUid !== decoded.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Delete followers subcollection docs (best-effort)
    const followersSnap = await docRef.collection('followers').get()
    const batch = db.batch()
    followersSnap.forEach(d => batch.delete(d.ref))
    batch.delete(docRef)
    await batch.commit()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/lists/[id] error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

type PutBody = {
  title?: string | null
  entries: Array<{ order?: number; name: string; mapsUrl?: string; address?: string; note?: string }>
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authz = req.headers.get('authorization') || ''
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : undefined
    const decoded = await verifyIdToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getAdminDb()
    const { id } = params
    const docRef = db.collection('lists').doc(id)
    const snap = await docRef.get()
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const data = snap.data() as any
    if (data.ownerUid !== decoded.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await req.json()) as PutBody
    const rawEntries = Array.isArray(body.entries) ? body.entries : []
    if (rawEntries.length === 0 || rawEntries.length > 10) {
      return NextResponse.json({ error: 'Entries must be 1..10' }, { status: 400 })
    }
    const entries = rawEntries.map((e, i) => {
      const out: any = {
        order: typeof e.order === 'number' ? e.order : i + 1,
        name: (e.name || '').trim(),
      }
      const mapsUrl = (e.mapsUrl || '').trim()
      const address = (e.address || '').trim()
      const note = typeof e.note === 'string' ? e.note.trim() : ''
      if (mapsUrl) out.mapsUrl = mapsUrl
      if (address) out.address = address
      if (note) out.note = note
      return out
    }).filter(e => e.name)

    const update: any = { updatedAt: new Date(), entries }
    if (body.title !== undefined) update.title = body.title ?? null

    await docRef.set(update, { merge: true })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PUT /api/lists/[id] error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


