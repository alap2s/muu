import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { collectionId, userId } = await req.json()

    if (!collectionId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const followerRef = doc(db, 'collections', collectionId, 'followers', userId)

    await setDoc(followerRef, {
      followedAt: serverTimestamp(),
    })

    return NextResponse.json({ message: 'Successfully followed collection' }, { status: 200 })
  } catch (error) {
    console.error('Error following collection: ', error)
    return NextResponse.json({ error: 'Failed to follow collection' }, { status: 500 })
  }
}
