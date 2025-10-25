"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Bookmark, ChevronRight, Heart, CornerUpRight, Utensils, Pencil, Trash } from 'lucide-react'
import { ListItem } from '../../design-system/components/ListItem'
import { Button } from '../../design-system/components/Button'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuth } from '../../context/AuthContext'

type ListEntry = { name: string; mapsUrl?: string; address?: string; note?: string }

export default function ListDetailsPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const { currentUser } = useAuth()
  const isMobile = useIsMobile()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')
  const [ownerName, setOwnerName] = useState<string>('')
  const [ownerUid, setOwnerUid] = useState<string>('')
  const [entries, setEntries] = useState<ListEntry[]>([])
  const [followers, setFollowers] = useState<number>(0)
  const [followed, setFollowed] = useState<boolean>(false)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [anchorRects, setAnchorRects] = useState<Record<number, { top: number; left: number; width: number }>>({})
  const [entryLikes, setEntryLikes] = useState<Record<number, { likes: number; liked: boolean }>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/lists/${params.id}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        const list = data.list
        setTitle(list.title || 'List')
        setOwnerName(list.ownerName || 'Anonymous')
        setOwnerUid(list.ownerUid || '')
        setEntries(Array.isArray(list.entries) ? list.entries : [])
        setFollowers(typeof list.followers === 'number' ? list.followers : 0)
      } catch (e) {
        setError('Could not load list')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const isOwn = useMemo(() => currentUser && ownerUid && currentUser.uid === ownerUid, [currentUser, ownerUid])

  useEffect(() => {
    const checkFollow = async () => {
      if (!currentUser) return
      try {
        const idToken = await currentUser.getIdToken()
        const res = await fetch(`/api/lists/follow?listId=${params.id}`, { headers: { Authorization: `Bearer ${idToken}` } })
        if (!res.ok) return
        const data = await res.json()
        setFollowed(!!data.followed)
      } catch {}
    }
    checkFollow()
  }, [currentUser, params.id])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background-main)', color: 'var(--text-main)' }}>
      {/* Header reused pattern from restaurant details page */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--background-main)', borderBottom: '1px solid var(--border-main)' }}>
        <div className="max-w-4xl mx-auto flex items-center" style={{ minHeight: 48 }}>
          <div style={{ width: 32 }} />
          <div className="flex items-center" style={{ width: 48 }}>
            <Button variant="ghost" onClick={() => router.push('/')} aria-label="Back">
              <ChevronLeft size={18} color="var(--accent)" />
            </Button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ color: 'var(--accent)', fontWeight: 500, textAlign: 'left' }}>List</div>
          </div>
          <div className="flex items-center justify-end gap-1" style={{ width: 96 }}>
            {isOwn ? (
              <>
                <Button
                  variant="ghost"
                  aria-label="Edit list"
                  onClick={() => {
                    // Navigate to create page for editing (prefill can read ?id)
                    router.push(`/lists/create?id=${params.id}`)
                  }}
                >
                  <Pencil size={18} color="var(--accent)" />
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Delete list"
                  onClick={async () => {
                    try {
                      if (!currentUser) {
                        const next = encodeURIComponent(`/lists/${params.id}`)
                        router.push(`/login?next=${next}`)
                        return
                      }
                      if (!confirm('Delete this list? This cannot be undone.')) return
                      const idToken = await currentUser.getIdToken()
                      const res = await fetch(`/api/lists/${params.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${idToken}` }
                      })
                      if (res.ok) {
                        router.push('/')
                      }
                    } catch {}
                  }}
                >
                  <Trash size={18} color="var(--accent)" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                aria-label="Follow list"
                onClick={async () => {
                  try {
                    if (!currentUser) {
                      const next = encodeURIComponent(`/lists/${params.id}`)
                      router.push(`/login?next=${next}`)
                      return
                    }
                    const idToken = await currentUser.getIdToken()
                    const res = await fetch('/api/lists/follow', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                      body: JSON.stringify({ listId: params.id })
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setFollowed(!!data.followed)
                      setFollowers(prev => Math.max(0, prev + (data.followed ? 1 : -1)))
                    }
                  } catch {}
                }}
              >
                <div className="flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <Bookmark size={18} fill={followed ? 'var(--accent)' : 'none'} color="var(--accent)" />
                  <span style={{ fontSize: 12 }}>{followers}</span>
                </div>
              </Button>
            )}
          </div>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {/* Body: replicate Places tab list styling */}
      <div className="max-w-4xl mx-auto space-y-0">
        {/* Meta row: show owner full name with subtitle "List by" */}
        <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
          <div style={{ width: 32, minHeight: 48, borderRight: '1px solid var(--border-main)' }} />
          <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: 0 }} className="min-w-0">
            <ListItem title={ownerName || 'Anonymous'} subtitle="List by" />
          </div>
          <div style={{ width: 32, minHeight: 48, borderLeft: '1px solid var(--border-main)' }} />
        </div>

        {/* Entries rendered exactly like Places rows */}
        {loading && (
          <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, minHeight: 48, borderRight: '1px solid var(--border-main)' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: 0 }} className="min-w-0">
              <ListItem title="Loading..." />
            </div>
            <div style={{ width: 32, minHeight: 48, borderLeft: '1px solid var(--border-main)' }} />
          </div>
        )}
        {error && (
          <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ width: 32, minHeight: 48, borderRight: '1px solid var(--border-main)' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: 0 }} className="min-w-0">
              <ListItem title={error} />
            </div>
            <div style={{ width: 32, minHeight: 48, borderLeft: '1px solid var(--border-main)' }} />
          </div>
        )}
        {!loading && !error && entries.map((e, idx) => (
          <div className="flex justify-center" style={{ borderBottom: '1px solid var(--border-main)', position: 'relative' }} key={idx}>
            <div style={{ width: 32, minHeight: 48, borderRight: '1px solid var(--border-main)' }} />
            <div style={{ flex: 1, maxWidth: 800, display: 'flex', alignItems: 'center', minHeight: 48, padding: 0 }} className="min-w-0">
              <ListItem
                title={e.name}
                subtitle={e.address}
                onClick={async (ev: any) => {
                  const target = (ev.currentTarget as HTMLElement)
                  const rect = target.getBoundingClientRect()
                  setAnchorRects(prev => ({ ...prev, [idx]: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width } }))
                  setOpenIdx(openIdx === idx ? null : idx)
                  // preload likes for this entry
                  try {
                    const authHeader = currentUser ? { Authorization: `Bearer ${await currentUser.getIdToken()}` } : {}
                    const url = new URL('/api/restaurants/like', window.location.origin)
                    if (e.mapsUrl) url.searchParams.set('mapsUrl', e.mapsUrl)
                    const res = await fetch(url.toString(), { headers: { ...(authHeader as any) } })
                    const data = await res.json()
                    setEntryLikes(prev => ({ ...prev, [idx]: { likes: data.likes || 0, liked: !!data.liked } }))
                  } catch {}
                }}
                endContent={<ChevronRight className="w-4 h-4 text-gray-500" />}
              />
            </div>
            <div style={{ width: 32, minHeight: 48, borderLeft: '1px solid var(--border-main)' }} />

            {/* Flyout menu */}
            {openIdx === idx && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 50 }}>
                <div
                  onClick={() => setOpenIdx(null)}
                  style={{ position: 'absolute', inset: 0, background: 'transparent' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: (anchorRects[idx]?.left ?? 32),
                    top: (anchorRects[idx]?.top ?? 0),
                    width: (anchorRects[idx]?.width ?? Math.min(window.innerWidth - 64, 1024)),
                    background: 'var(--background-secondary)',
                    border: '1px solid var(--accent)'
                  }}
                >
                  {/* Mark as favorite */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!currentUser) {
                          const next = encodeURIComponent(`/lists/${params.id}`)
                          router.push(`/login?next=${next}`)
                          return
                        }
                        const liked = !!entryLikes[idx]?.liked
                        const token = await currentUser.getIdToken()
                        const res = await fetch('/api/restaurants/like', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ mapsUrl: e.mapsUrl, name: e.name, address: e.address, like: !liked })
                        })
                        const data = await res.json()
                        if (res.ok) {
                          setEntryLikes(prev => ({ ...prev, [idx]: { likes: data.likes || 0, liked: !liked } }))
                        }
                      } catch {}
                      finally {
                        setOpenIdx(null)
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', width: '100%',
                      borderBottom: '1px solid var(--border-main)', background: 'var(--background-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Heart className="w-4 h-4" color="var(--accent)" fill={entryLikes[idx]?.liked ? 'var(--accent)' : 'none'} />
                      <span style={{ color: 'var(--text-primary)' }}>
                        {entryLikes[idx]?.liked ? 'Favorited' : 'Mark as favorite'}
                        {typeof entryLikes[idx]?.likes === 'number' ? ` (${entryLikes[idx]!.likes})` : ''}
                      </span>
                    </div>
                  </button>
                  {/* Open in maps */}
                  <button
                    type="button"
                    onClick={() => {
                      if (e.mapsUrl) window.open(e.mapsUrl, '_blank')
                      setOpenIdx(null)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', width: '100%',
                      borderBottom: '1px solid var(--border-main)', background: 'var(--background-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CornerUpRight className="w-4 h-4" color="var(--accent)" />
                      <span style={{ color: 'var(--text-primary)' }}>Open in maps</span>
                    </div>
                  </button>
                  {/* Show menu (if available) */}
                  <button
                    type="button"
                    onClick={() => {
                      // Placeholder: navigate if a restaurant id/url exists
                      setOpenIdx(null)
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', width: '100%', background: 'var(--background-secondary)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Utensils className="w-4 h-4" color="var(--accent)" />
                      <span style={{ color: 'var(--text-primary)' }}>Show menu</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


