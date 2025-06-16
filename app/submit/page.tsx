'use client'

import { useState } from 'react'
import { Input } from '@/app/design-system/components/Input'
import { Button } from '@/app/design-system/components/Button'
import { ImageUpload } from '@/app/design-system/components/ImageUpload'
import { toast } from 'react-hot-toast'

interface Coordinates {
  lat: number
  lng: number
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  dietaryRestrictions?: string[]
}

export default function SubmitPage() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [menuPhotos, setMenuPhotos] = useState<File[]>([])
  const [parsedMenu, setParsedMenu] = useState<MenuItem[]>([])

  const handleAddressChange = async (value: string) => {
    setAddress(value)
    
    // Debounce geocoding requests
    if (value.length > 5) {
      try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(value)}`)
        const data = await response.json()
        
        if (data.coordinates) {
          setCoordinates(data.coordinates)
        }
      } catch (error) {
        console.error('Error geocoding address:', error)
      }
    }
  }

  const handlePhotosChange = async (files: File[]) => {
    setMenuPhotos(files)
    
    if (files.length > 0) {
      setLoading(true)
      try {
        // Create FormData with photos
        const formData = new FormData()
        files.forEach(file => formData.append('photos', file))
        
        // Send to menu parsing API
        const response = await fetch('/api/parse-menu', {
          method: 'POST',
          body: formData
        })
        
        const data = await response.json()
        if (data.menuItems && Array.isArray(data.menuItems)) {
          setParsedMenu(data.menuItems)
        } else {
          console.error('Invalid menu items format received:', data)
          setParsedMenu([])
        }
      } catch (error) {
        console.error('Error parsing menu:', error)
        setParsedMenu([])
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMenuUrlChange = async (url: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/parse-menu-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a minute.')
        } else {
          toast.error(`Error: ${data.error || 'Failed to parse menu'}`)
        }
        return
      }

      if (!data.menuItems) {
        toast.error('No menu items found')
        return
      }

      setParsedMenu(data.menuItems)
    } catch (error) {
      console.error('Error parsing menu:', error)
      toast.error('Failed to parse menu. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!name || !address || !coordinates || parsedMenu.length === 0) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          address,
          coordinates,
          menuUrl,
          menu: {
            categories: parsedMenu.reduce((acc, item) => {
              const category = acc.find(c => c.name === item.category)
              if (category) {
                category.items.push(item)
              } else {
                acc.push({
                  id: item.category.toLowerCase().replace(/\s+/g, '-'),
                  name: item.category,
                  items: [item]
                })
              }
              return acc
            }, [] as any[])
          }
        })
      })

      if (response.ok) {
        // Redirect to homepage or show success message
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error submitting restaurant:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      <div className="flex">
        <div className="w-8 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8]" />
        <div className="flex-1 h-12 border-r border-[#FF373A]/20 bg-[#F4F2F8] flex items-center justify-center">
          <h1 className="text-primary font-mono">Submit New Restaurant</h1>
        </div>
        <div className="w-8 h-12 border-l border-[#FF373A]/20 bg-[#F4F2F8]" />
      </div>

      <div className="grid grid-cols-12 gap-4 p-8">
        <div className="col-span-12">
          <Input
            label="Restaurant Name"
            placeholder="Enter restaurant name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="col-span-12">
          <Input
            label="Address"
            placeholder="Enter full address"
            name="address"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
          />
          {coordinates && (
            <p className="mt-2 text-sm text-gray-600 font-mono">
              Coordinates: {coordinates.lat}, {coordinates.lng}
            </p>
          )}
        </div>

        <div className="col-span-12">
          <Input
            label="Menu Website URL (Optional)"
            placeholder="Enter menu website URL"
            name="menuUrl"
            value={menuUrl}
            onChange={(e) => handleMenuUrlChange(e.target.value)}
          />
        </div>

        <div className="col-span-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#FF373A]/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-sm text-gray-600 font-mono bg-white">OR</span>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <ImageUpload
            label="Menu Photos"
            description="Upload photos of the menu (max 5 photos)"
            maxFiles={5}
            accept="image/*"
            onChange={handlePhotosChange}
          />
        </div>

        <div className="col-span-12">
          <div className="bg-[#F4F2F8] p-4 rounded-lg">
            <h2 className="text-primary font-mono mb-4">Parsed Menu Items</h2>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[#FF373A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : parsedMenu.length > 0 ? (
                parsedMenu.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-mono text-black">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        <p className="text-sm font-mono text-gray-600 mt-1">
                          Category: {item.category}
                        </p>
                      </div>
                      <p className="font-mono text-black">{item.price.toFixed(2)} €</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic text-center py-4">
                  Menu items will appear here after uploading photos or entering a menu URL...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!name || !address || !coordinates || parsedMenu.length === 0}
            loading={loading}
          >
            Push to Database
          </Button>
        </div>
      </div>
    </div>
  )
} 