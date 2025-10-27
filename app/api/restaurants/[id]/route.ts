import { NextResponse } from 'next/server'
import { getAdminDb, verifyIdToken } from '../../../../lib/firebaseAdmin'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.replace('Bearer ', '')
    const decoded = await verifyIdToken(idToken || undefined)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const allowed = ['name', 'address', 'website', 'notes', 'menuCategories', 'coordinates', 'isHidden', 'placeId'] as const
    const updateData: Record<string, any> = {}
    for (const k of allowed) {
      const v = body[k]
      if (v !== undefined) updateData[k] = v
    }
    updateData.updatedAt = new Date()

    // Basic validation
    if (typeof updateData.name !== 'string' || !updateData.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (typeof updateData.address !== 'string' || !updateData.address.trim()) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }
    if (updateData.coordinates) {
      const { lat, lng } = updateData.coordinates || {}
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
      }
    }

    const db = getAdminDb()
    // if payload contains placeId and differs from params.id, write under placeId and delete old
    const placeId: string | undefined = updateData.placeId
    if (placeId && placeId !== params.id) {
      const targetRef = db.doc(`restaurants/${placeId}`)
      await targetRef.set(updateData, { merge: true })
      // migrate likes subcollection best-effort
      try {
        const srcRef = db.doc(`restaurants/${params.id}`)
        const likes = await srcRef.collection('likes').get()
        const batch = db.batch()
        likes.forEach(d => batch.set(targetRef.collection('likes').doc(d.id), d.data(), { merge: true }))
        batch.delete(srcRef)
        await batch.commit()
      } catch {}
      return NextResponse.json({ ok: true, id: placeId })
    }
    await db.doc(`restaurants/${params.id}`).set(updateData, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('REST PUT /restaurants/:id error', e)
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const idToken = req.headers.get('authorization')?.replace('Bearer ', '')
    const decoded = await verifyIdToken(idToken || undefined)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Admin enforcement: allow only admins/allowlisted emails
    const isAdminClaim = (decoded as any)?.admin === true
    const allow = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)
    const email = (decoded as any)?.email as string | undefined
    const isAllowlisted = !!email && allow.includes(email)
    if (!isAdminClaim && !isAllowlisted) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = getAdminDb()
    await db.doc(`restaurants/${params.id}`).delete()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('REST DELETE /restaurants/:id error', e)
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 })
  }
}


