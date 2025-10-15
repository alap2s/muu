import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

// NOTE: This endpoint expects the client to send the authenticated user's minimal profile.
// In a production app, prefer verifying an ID token on the server with firebase-admin.

export async function POST(req: NextRequest) {
  try {
    const { uid, displayName, email, photoURL } = await req.json()
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

    const userRef = doc(db, 'users', uid)
    await setDoc(userRef, {
      uid,
      displayName: displayName || '',
      email: email || '',
      photoURL: photoURL || '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('Upsert user failed', err)
    return NextResponse.json({ error: 'Upsert failed' }, { status: 500 })
  }
}


