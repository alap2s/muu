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
    // helper to get placeId from maps url
    const extractPlaceId = (url?: string | null): string | null => {
      if (!url) return null
      try {
        const m = /place_id:([A-Za-z0-9_-]+)/.exec(url)
        if (m && m[1]) return m[1]
      } catch {}
      return null
    }

    // build entries with placeId and seed restaurant stubs
    const entriesWithIds = [] as Array<{ order: number; name: string; mapsUrl?: string | null; address?: string | null; note?: string | null; placeId?: string | null; restaurantId?: string | null }>
    for (const e of body.entries) {
      const placeId = extractPlaceId(e.mapsUrl || undefined)
      if (placeId) {
        // seed/merge minimal restaurant doc under placeId
        const restRef = db.collection('restaurants').doc(placeId)
        await restRef.set({
          placeId,
          name: e.name || null,
          address: e.address || null,
          updatedAt: new Date(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true })
      }
      entriesWithIds.push({
        order: e.order,
        name: e.name,
        mapsUrl: e.mapsUrl || null,
        address: e.address || null,
        note: e.note || null,
        placeId: placeId || null,
        restaurantId: placeId || null,
      })
    }

    // Enforce one-list-per-user: if user already has a list, update it instead of creating a new one
    const existingSnap = await listsCol.where('ownerUid', '==', decoded.uid).limit(1).get()
    if (!existingSnap.empty) {
      const existingRef = existingSnap.docs[0].ref
      await existingRef.set({
        title: body.title || null,
        entries: entriesWithIds,
        updatedAt: now,
      }, { merge: true })
      return NextResponse.json({ id: existingRef.id, updated: true })
    }

    const docRef = await listsCol.add({
      ownerUid: decoded.uid,
      title: body.title || null,
      entries: entriesWithIds,
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


