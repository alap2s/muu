import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { RestaurantCollection } from '../../../../app/types/collection'

export async function POST(req: NextRequest) {
  try {
    const { name, description, ownerId, restaurantIds, isPublic } = await req.json()

    if (!name || !ownerId || !restaurantIds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newCollection: Omit<RestaurantCollection, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description: description || '',
      ownerId,
      restaurantIds,
      isPublic: isPublic || false,
    };

    const docRef = await addDoc(collection(db, 'collections'), {
      ...newCollection,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ id: docRef.id }, { status: 201 })
  } catch (error) {
    console.error('Error adding collection: ', error)
    return NextResponse.json({ error: 'Failed to add collection' }, { status: 500 })
  }
}
