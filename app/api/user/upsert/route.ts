import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const idToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    const decoded = await verifyIdToken(idToken)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const uid: string = decoded.uid
    const { displayName = null, email = null, photoURL = null } = body || {}

    const db = getAdminDb()
    const userRef = db.collection('users').doc(uid)
    const now = new Date()
    await userRef.set(
      {
        uid,
        displayName,
        email,
        photoURL,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('User upsert failed:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Removed client-SDK based implementation in favor of Admin-verified version above


