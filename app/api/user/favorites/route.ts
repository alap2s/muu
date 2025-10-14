import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { userId, restaurantId, action } = await req.json()

    if (!userId || !restaurantId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userRef = doc(db, 'users', userId)

    if (action === 'add') {
      await updateDoc(userRef, {
        favoriteRestaurants: arrayUnion(restaurantId),
      })
      return NextResponse.json({ message: 'Successfully added to favorites' }, { status: 200 })
    } else if (action === 'remove') {
      await updateDoc(userRef, {
        favoriteRestaurants: arrayRemove(restaurantId),
      })
      return NextResponse.json({ message: 'Successfully removed from favorites' }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating favorites: ', error)
    return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 })
  }
}
