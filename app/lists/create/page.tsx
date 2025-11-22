'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useViewMode } from '../../contexts/ViewModeContext'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../design-system/components/Button'
import { ListItem } from '../../design-system/components/ListItem'
import { Input } from '../../design-system/components/Input'
import { X, Check, MapPin, Plus, Trash2, Loader2, LucideIcon, LucideProps } from 'lucide-react'
import { StickyNote } from 'lucide-react'
import { Dropdown } from '../../design-system/components/Dropdown'
import { GridRow } from '../../design-system/components/GridRow'
import { PageShell } from '../../design-system/components/PageShell'
import { Header as DSHeader } from '../../design-system/components/Header'
import { PageContentStack } from '../../design-system/components/PageContentStack'

interface ListEntry {
  id: string
  name: string
  mapsUrl: string
  address?: string
  note?: string
}

export default function CreateListPage() {
  const router = useRouter()
  const { viewMode } = useViewMode()
  const { currentUser, getIdToken } = useAuth()

  const [entries, setEntries] = useState<ListEntry[]>([])
  const [listId, setListId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [resolvingName, setResolvingName] = useState<Record<string, boolean>>({})
  const [resolvingUrl, setResolvingUrl] = useState<Record<string, boolean>>({})
  const [resolveError, setResolveError] = useState<Record<string, string | null>>({})
  const [suggestions, setSuggestions] = useState<Record<string, Array<{ placeId: string; primaryText: string; secondaryText: string; description: string }>>>({})
  const [suggestOpenFor, setSuggestOpenFor] = useState<string | null>(null)
  const [sessionTokenFor, setSessionTokenFor] = useState<Record<string, string>>({})
  const [typingTimers, setTypingTimers] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {}
      )
    }
  }, [])

  // Load existing list if ?id provided (edit mode)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id) {
        setListId(id)
        ;(async () => {
          try {
            const res = await fetch(`/api/lists/${id}`)
            if (!res.ok) return
            const data = await res.json()
            const list = data.list
            const es = (Array.isArray(list.entries) ? list.entries : []).map((e: any, i: number) => ({
              id: crypto.randomUUID(),
              name: e.name || '',
              mapsUrl: e.mapsUrl || '',
              address: e.address || '',
              note: e.note || '',
            }))
            setEntries(es.length ? es : [{ id: crypto.randomUUID(), name: '', mapsUrl: '', address: '', note: '' }])
          } catch {
            setEntries([{ id: crypto.randomUUID(), name: '', mapsUrl: '', address: '', note: '' }])
          }
        })()
      } else {
        setEntries([{ id: crypto.randomUUID(), name: '', mapsUrl: '', address: '', note: '' }])
      }
    } catch {
      setEntries([{ id: crypto.randomUUID(), name: '', mapsUrl: '', address: '', note: '' }])
    }
  }, [])

  const handleBack = () => router.back()

  const createNumberIcon = (n: number): LucideIcon => {
    const NumberIcon = React.forwardRef<SVGSVGElement, LucideProps>(({ className, style, ...rest }, ref) => (
      <svg
        ref={ref}
        className={className}
        width={16}
        height={16}
        viewBox="0 0 16 16"
        style={{ display: 'block', color: 'var(--accent)', ...(style || {}) }}
        {...rest}
      >
        <text
          x="65%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="currentColor"
        >
          {`${n}.`}
        </text>
      </svg>
    )) as unknown as LucideIcon
    return NumberIcon
  }

  const updateEntry = (id: string, field: keyof Omit<ListEntry,'id'>, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addEntry = () => setEntries(prev => prev.length >= 10 ? prev : [...prev, { id: crypto.randomUUID(), name: '', mapsUrl: '', address: '', cuisine: '' }])
  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))

  return (
    <PageShell
      header={
        <DSHeader
          left={
            <Button variant="secondary" onClick={handleBack} aria-label="Cancel">
              <X className="w-4 h-4" />
            </Button>
          }
          center={
            <div style={{ width: '100%', display: 'flex', justifyContent: 'left', padding: '0 16px' }}>
              <h1 className="text-base font-medium" style={{ color: 'var(--accent)' }}>Create List</h1>
            </div>
          }
          right={
            <Button variant="primary" aria-label="Save" loading={isSaving} disabled={isSaving} onClick={async () => {
            if (isSaving) return
            // require login
            if (!currentUser) {
              router.push(`/login?next=/lists/create`)
              return
            }
            // prepare payload
            const payload = {
              title: '',
              entries: entries
                .map((e, i) => ({ order: i + 1, name: e.name.trim(), mapsUrl: e.mapsUrl || undefined, address: e.address || undefined, note: e.note || undefined }))
                .filter(e => e.name)
            }
            try {
              setIsSaving(true)
              const token = await getIdToken()
              if (listId) {
                const res = await fetch(`/api/lists/${listId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) })
                if (!res.ok) { alert('Failed to update list'); return }
                router.push(`/lists/${listId}`)
              } else {
                const res = await fetch('/api/lists/create', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) })
                if (!res.ok) { alert('Failed to save list'); return }
                const data = await res.json()
                router.push(`/lists/${data.id || ''}`)
              }
            } catch {
              alert('Failed to save list')
            } finally {
              setIsSaving(false)
            }
          }}>
              <Check className="w-4 h-4" />
            </Button>
          }
        />
      }
    >
      <PageContentStack className="space-y-0">
        {/* Title row */}
        <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48, padding: 0 }} className="min-w-0">
            <ListItem title="" subtitle="Create a list of your top 10 spots" />
          </div>
        </GridRow>

        {/* Entry rows */}
        {entries.map((entry, idx) => (
          <React.Fragment key={entry.id}>
            {/* Name row */}
            <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', minHeight: 48, position: 'relative' }}>
                <Input
                  icon={createNumberIcon(Math.min(idx + 1, 10))}
                  placeholder={`Restaurant name${idx === 0 ? '' : ''}`}
                  value={entry.name}
                  onFocus={() => {
                    if (!sessionTokenFor[entry.id]) {
                      setSessionTokenFor(prev => ({ ...prev, [entry.id]: crypto.randomUUID() }))
                    }
                    setSuggestOpenFor(entry.id)
                  }}
                  onChange={(e) => {
                    const val = e.target.value
                    updateEntry(entry.id, 'name', val)
                    setResolveError(prev => ({ ...prev, [entry.id]: null }))
                    // debounce
                    if (typingTimers[entry.id]) clearTimeout(typingTimers[entry.id])
                    const t = setTimeout(async () => {
                      if (val.trim().length < 3) { setSuggestions(prev => ({ ...prev, [entry.id]: [] })); return }
                      try {
                        const res = await fetch('/api/places/suggest', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ input: val, lat: userLocation?.lat, lng: userLocation?.lng, sessionToken: sessionTokenFor[entry.id] })
                        })
                        const data = await res.json()
                        setSuggestions(prev => ({ ...prev, [entry.id]: data.predictions || [] }))
                      } catch {
                        setSuggestions(prev => ({ ...prev, [entry.id]: [] }))
                      }
                    }, 300)
                    setTypingTimers(prev => ({ ...prev, [entry.id]: t }))
                  }}
                  onBlur={async () => {
                    if (!entry.name || entry.mapsUrl) return
                    setResolvingName(prev => ({ ...prev, [entry.id]: true }))
                    setResolveError(prev => ({ ...prev, [entry.id]: null }))
                    try {
                      const res = await fetch('/api/places/resolve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: entry.name, lat: userLocation?.lat, lng: userLocation?.lng })
                      })
                      if (!res.ok) {
                        let err: any = null
                        try { err = await res.json() } catch {}
                        setResolveError(prev => ({ ...prev, [entry.id]: err?.error || 'No place found' }))
                        return
                      }
                      const data = await res.json()
                      if (data?.googleMapsUrl) {
                        updateEntry(entry.id, 'mapsUrl', data.googleMapsUrl)
                      }
                    } catch {
                      setResolveError(prev => ({ ...prev, [entry.id]: 'Failed to resolve place' }))
                    } finally {
                      setResolvingName(prev => ({ ...prev, [entry.id]: false }))
                    }
                  }}
                  className="w-full text-sm"
                />
                {/* Suggestions dropdown under input (styled like Dropdown list) */}
                {suggestOpenFor === entry.id && (suggestions[entry.id]?.length ?? 0) > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9998, background: 'var(--background-secondary)', border: '1px solid var(--accent)' }}>
                    {suggestions[entry.id]!.map((s, i) => (
                      <div key={s.placeId} style={{ padding: '12px 16px', borderBottom: i === suggestions[entry.id]!.length - 1 ? 'none' : '1px solid var(--border-main)', cursor: 'pointer' }}
                        onMouseDown={async (e) => {
                          e.preventDefault()
                          setSuggestOpenFor(null)
                          // Blur the name input to release focus
                          try { (document.activeElement as HTMLElement | null)?.blur() } catch {}
                          // Show loading on both name and address/cuisine while resolving
                          setResolvingName(prev => ({ ...prev, [entry.id]: true }))
                          setResolvingUrl(prev => ({ ...prev, [entry.id]: true }))
                          // Optimistically set the name to selected primary text immediately
                          updateEntry(entry.id, 'name', s.primaryText)
                          // Resolve selection via placeId for canonical data
                          try {
                            const resp = await fetch('/api/places/resolve', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ placeId: s.placeId })
                            })
                            const data = await resp.json()
                            if (data?.name) updateEntry(entry.id, 'name', data.name)
                            if (data?.googleMapsUrl) updateEntry(entry.id, 'mapsUrl', data.googleMapsUrl)
                            if (data?.formattedAddress) updateEntry(entry.id, 'address', data.formattedAddress)
                            // no cuisine; we use manual note instead
                          } catch {}
                          finally {
                            setResolvingName(prev => ({ ...prev, [entry.id]: false }))
                            setResolvingUrl(prev => ({ ...prev, [entry.id]: false }))
                          }
                        }}
                      >
                        <div style={{ fontSize: 14, color: 'var(--accent)' }}>{s.primaryText}</div>
                        {s.secondaryText && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.secondaryText}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {resolvingName[entry.id] && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </div>
              <div className="flex-none" style={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button variant="secondary" onClick={() => removeEntry(entry.id)} aria-label="Remove entry">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </GridRow>

            {/* Maps URL row */}
            <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <Input
                  icon={MapPin}
                  placeholder="Address or Google Maps link"
                  value={entry.address || entry.mapsUrl}
                  onChange={(e) => {
                    const v = e.target.value
                    updateEntry(entry.id, 'address', v)
                    updateEntry(entry.id, 'mapsUrl', v.startsWith('http') ? v : entry.mapsUrl)
                  }}
                  onBlur={async () => {
                    if (!entry.address && (!entry.mapsUrl || entry.name)) return
                    setResolvingUrl(prev => ({ ...prev, [entry.id]: true }))
                    setResolveError(prev => ({ ...prev, [entry.id]: null }))
                    try {
                      const res = await fetch('/api/places/resolve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(
                          entry.mapsUrl && entry.mapsUrl.startsWith('http')
                            ? { url: entry.mapsUrl, lat: userLocation?.lat, lng: userLocation?.lng }
                            : { name: `${entry.name} ${entry.address || ''}`.trim(), lat: userLocation?.lat, lng: userLocation?.lng }
                        )
                      })
                      if (!res.ok) {
                        let err: any = null
                        try { err = await res.json() } catch {}
                        setResolveError(prev => ({ ...prev, [entry.id]: err?.error || 'No place found' }))
                        return
                      }
                      const data = await res.json()
                      if (data?.name) updateEntry(entry.id, 'name', data.name)
                      if (data?.googleMapsUrl) updateEntry(entry.id, 'mapsUrl', data.googleMapsUrl)
                      if (data?.formattedAddress) updateEntry(entry.id, 'address', data.formattedAddress)
                    } catch {
                      setResolveError(prev => ({ ...prev, [entry.id]: 'Failed to resolve place' }))
                    } finally {
                      setResolvingUrl(prev => ({ ...prev, [entry.id]: false }))
                    }
                  }}
                  className="w-full text-sm"
                />
              </div>
            </GridRow>

            {/* Note row */}
            <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48 }}>
                <Input
                  icon={StickyNote}
                  placeholder="Note (e.g. best dumplings in town)"
                  value={entry.note || ''}
                  onChange={(e) => updateEntry(entry.id, 'note', e.target.value)}
                  className="w-full text-sm"
                />
                {resolvingUrl[entry.id] && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </div>
            </GridRow>

            {resolveError[entry.id] && (
              <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800} minHeight={32}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 32 }}>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>{resolveError[entry.id]}</span>
                </div>
              </GridRow>
            )}

            {/* Spacer row between entries */}
            <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
              <div style={{ flex: 1, minHeight: 48 }} />
            </GridRow>
          </React.Fragment>
        ))}

        {/* Add row (after one empty spacer row above from last entry) */}
        {entries.length < 10 && (
          <GridRow showRails={viewMode === 'grid'} borderBottom maxWidth={800}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 48 }}>
              <Button variant="secondary" onClick={addEntry} className="w-full" aria-label="Add restaurant">
                <Plus className="w-4 h-4 mr-2" />
                Add restaurant
              </Button>
            </div>
          </GridRow>
        )}
      </PageContentStack>
    </PageShell>
  )
}


