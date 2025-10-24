import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'
import admin from 'firebase-admin'

type LikeBody = { restaurantId: string; like: boolean }

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    const decoded = await verifyIdToken(idToken)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as LikeBody
    if (!body.restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

    const db = getAdminDb()
    const restDoc = db.collection('restaurants').doc(body.restaurantId)
    const userLikeDoc = restDoc.collection('likes').doc(decoded.uid)

    await db.runTransaction(async (tx) => {
      const likeSnap = await tx.get(userLikeDoc)
      const hasLike = likeSnap.exists
      if (body.like && !hasLike) {
        tx.set(userLikeDoc, { createdAt: new Date() })
        tx.set(restDoc, { likes: admin.firestore.FieldValue.increment(1) }, { merge: true })
      } else if (!body.like && hasLike) {
        tx.delete(userLikeDoc)
        tx.set(restDoc, { likes: admin.firestore.FieldValue.increment(-1) }, { merge: true })
      }
    })

    const updated = await restDoc.get()
    return NextResponse.json({ likes: updated.get('likes') || 0 })
  } catch (e) {
    console.error('Like toggle failed:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


