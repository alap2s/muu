import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'
import admin from 'firebase-admin'

type LikeBody = {
  restaurantId?: string
  placeId?: string
  mapsUrl?: string
  name?: string
  address?: string
  like: boolean
}

function extractPlaceId(mapsUrl?: string | null): string | null {
  if (!mapsUrl) return null
  try {
    // supports ...place/?q=place_id:XXXXX and .../maps/place/....?q=place_id:XXXXX
    const m = /place_id:([A-Za-z0-9_-]+)/.exec(mapsUrl)
    if (m && m[1]) return m[1]
  } catch {}
  return null
}

async function getTargetRestaurantRef(db: FirebaseFirestore.Firestore, bodyOrQuery: any) {
  const body = bodyOrQuery || {}
  let restaurantId: string | null = body.restaurantId || null
  let placeId: string | null = body.placeId || null
  if (!placeId && body.mapsUrl) placeId = extractPlaceId(body.mapsUrl)

  if (restaurantId) {
    return db.collection('restaurants').doc(restaurantId)
  }
  if (placeId) {
    return db.collection('restaurants').doc(placeId)
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const placeId = searchParams.get('placeId')
    const mapsUrl = searchParams.get('mapsUrl')

    const ref = await getTargetRestaurantRef(db, { restaurantId, placeId, mapsUrl })
    if (!ref) return NextResponse.json({ likes: 0, liked: false })

    const snap = await ref.get()
    const likes = (snap.exists && (snap.get('likes') || 0)) || 0

    // liked status (optional if auth present)
    let liked = false
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    const decoded = await verifyIdToken(idToken)
    if (decoded) {
      const likeSnap = await ref.collection('likes').doc(decoded.uid).get()
      liked = likeSnap.exists
    }
    return NextResponse.json({ likes, liked })
  } catch (e) {
    console.error('Like GET failed:', e)
    return NextResponse.json({ likes: 0, liked: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    const decoded = await verifyIdToken(idToken)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as LikeBody
    const db = getAdminDb()

    // figure out target restaurant doc
    const ref = await getTargetRestaurantRef(db, body)
    if (!ref) return NextResponse.json({ error: 'restaurantId or placeId/mapsUrl required' }, { status: 400 })

    // ensure doc exists when using placeId/mapsUrl
    const snap = await ref.get()
    if (!snap.exists) {
      const seed: Record<string, any> = {
        name: body.name || '',
        address: body.address || '',
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await ref.set(seed, { merge: true })
    }
    const userLikeDoc = ref.collection('likes').doc(decoded.uid)

    await db.runTransaction(async (tx) => {
      const likeSnap = await tx.get(userLikeDoc)
      const hasLike = likeSnap.exists
      if (body.like && !hasLike) {
        tx.set(userLikeDoc, { createdAt: new Date() })
        tx.set(ref, { likes: admin.firestore.FieldValue.increment(1), updatedAt: new Date() }, { merge: true })
      } else if (!body.like && hasLike) {
        tx.delete(userLikeDoc)
        tx.set(ref, { likes: admin.firestore.FieldValue.increment(-1), updatedAt: new Date() }, { merge: true })
      }
    })

    const updated = await ref.get()
    return NextResponse.json({ likes: updated.get('likes') || 0 })
  } catch (e) {
    console.error('Like toggle failed:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


