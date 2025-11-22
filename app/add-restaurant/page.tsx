'use client'

import React from 'react'
import { useState } from 'react'
import { Store, MapPin, Layers, Utensils, Euro, Plus, Flame, Wheat, Leaf, Nut, Milk, Egg, Fish, Shell, Ban, Droplet, Wine, Candy, ArrowLeft, Filter, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MultiSelectDropdown } from '../design-system/components/MultiSelectDropdown'
import { Button } from '../design-system/components/Button'
import Link from 'next/link'
import { Input } from '../design-system/components/Input'
import { Dropdown } from '../design-system/components/Dropdown'

const DIETARY_OPTIONS = [
  { label: 'Vegetarian', value: 'vegetarian', leftContent: <Milk className="w-4 h-4" /> },
  { label: 'Vegan', value: 'vegan', leftContent: <Leaf className="w-4 h-4" /> },
  { label: 'Gluten-free', value: 'gluten-free', leftContent: <Wheat className="w-4 h-4" /> },
  { label: 'Spicy', value: 'spicy', leftContent: <Flame className="w-4 h-4" /> },
  { label: 'Nuts', value: 'nuts', leftContent: <Nut className="w-4 h-4" /> },
  { label: 'Dairy-free', value: 'dairy-free', leftContent: <Droplet className="w-4 h-4" /> },
  { label: 'Egg-free', value: 'egg-free', leftContent: <Egg className="w-4 h-4" /> },
  { label: 'Halal', value: 'halal', leftContent: <Fish className="w-4 h-4" /> },
  { label: 'Kosher', value: 'kosher', leftContent: <Fish className="w-4 h-4" /> },
  { label: 'Pescatarian', value: 'pescatarian', leftContent: <Fish className="w-4 h-4" /> },
  { label: 'Shellfish-free', value: 'shellfish-free', leftContent: <Shell className="w-4 h-4" /> },
  { label: 'Soy-free', value: 'soy-free', leftContent: <Ban className="w-4 h-4" /> },
  { label: 'Peanut-free', value: 'peanut-free', leftContent: <Nut className="w-4 h-4" /> },
  { label: 'Sesame-free', value: 'sesame-free', leftContent: <Ban className="w-4 h-4" /> },
  { label: 'Lactose-free', value: 'lactose-free', leftContent: <Droplet className="w-4 h-4" /> },
  { label: 'Sugar-free', value: 'sugar-free', leftContent: <Candy className="w-4 h-4" /> },
  { label: 'Alcohol-free', value: 'alcohol-free', leftContent: <Wine className="w-4 h-4" /> },
]

function DietaryDropdown({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <MultiSelectDropdown
      value={value}
      onChange={onChange}
      options={DIETARY_OPTIONS}
      placeholder="Select dietary restrictions"
      leftIcon={<Filter className="w-4 h-4" />}
    />
  )
}

export default function AddRestaurant() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [categories, setCategories] = useState([
    { name: '', foods: [ { name: '', price: '', description: '', dietary: [] as string[] } ] }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCategoryChange = (idx: number, value: string) => {
    setCategories(cats => cats.map((cat, i) => i === idx ? { ...cat, name: value } : cat))
  }
  const handleFoodChange = (catIdx: number, foodIdx: number, field: string, value: any) => {
    setCategories(cats => cats.map((cat, i) => i === catIdx ? {
      ...cat,
      foods: cat.foods.map((food, j) => j === foodIdx ? { ...food, [field]: value } : food)
    } : cat))
  }
  const addCategory = () => {
    setCategories(cats => [...cats, { name: '', foods: [ { name: '', price: '', description: '', dietary: [] as string[] } ] }])
  }
  const addFood = (catIdx: number) => {
    setCategories(cats => cats.map((cat, i) => i === catIdx ? {
      ...cat,
      foods: [...cat.foods, { name: '', price: '', description: '', dietary: [] as string[] }]
    } : cat))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)
    try {
      const menu = {
        categories: categories.map(cat => ({
          name: cat.name,
          items: cat.foods.map(food => ({
            name: food.name,
            price: parseFloat(food.price),
            description: food.description,
            dietaryRestrictions: food.dietary
          }))
        }))
      }

      const response = await fetch('/api/restaurants/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          address,
          menu
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add restaurant')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  // Grid layout: 32px border, 48px row height, maxWidth 1024px, mono font, accent color
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-main)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-[100]" style={{ background: 'var(--background-main)' }}>
        <div className="flex justify-center">
          <div style={{ width: 32, minHeight: 48, borderRight: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
          <div style={{ flex: 1, maxWidth: 1024, borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', minHeight: 48, position: 'relative' }}>
            <Link href="/">
              <Button variant="secondary" className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="font-mono font-bold" style={{ color: 'var(--accent)', fontSize: 18 }}>Add menu</span>
          </div>
          <div style={{ width: 32, minHeight: 48, borderLeft: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ height: 'calc(100vh - 48px - 80px)', overflowY: 'auto' }}>
        {[...Array(24)].map((_, i) => (
          <div key={i} className="flex justify-center">
            <div style={{ width: 32, minHeight: 48, borderRight: 'var(--border-hairline-solid)', borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
            <div style={{ flex: 1, maxWidth: 1024, borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', minHeight: 48, position: 'relative' }}>
              {i === 0 && (
                <div className="flex-1" />
              )}
              {i === 1 && (
                <div className="flex-1">
                  <Input
                    icon={Store}
                    type="text"
                    placeholder="Restaurant name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}
              {i === 2 && (
                <div className="flex-1">
                  <Input
                    icon={MapPin}
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
              )}
              {i === 3 && (
                <div className="flex-1" />
              )}
              {i === 4 && (
                <div className="flex-1">
                  <Input
                    icon={Layers}
                    type="text"
                    placeholder="Category name"
                    value={categories[0].name}
                    onChange={e => handleCategoryChange(0, e.target.value)}
                    required
                  />
                </div>
              )}
              {i === 5 && (
                <div className="flex-1">
                  <Input
                    icon={Utensils}
                    type="text"
                    placeholder="Food name"
                    value={categories[0].foods[0].name}
                    onChange={e => handleFoodChange(0, 0, 'name', e.target.value)}
                    required
                  />
                </div>
              )}
              {i === 6 && (
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Description"
                    value={categories[0].foods[0].description}
                    onChange={e => handleFoodChange(0, 0, 'description', e.target.value)}
                  />
                </div>
              )}
              {i === 7 && (
                <div className="flex-1 flex items-center">
                  <Input
                    icon={Euro}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={categories[0].foods[0].price}
                    onChange={e => handleFoodChange(0, 0, 'price', e.target.value)}
                    required
                  />
                  <div style={{ width: 48 }}>
                    <DietaryDropdown
                      value={categories[0].foods[0].dietary}
                      onChange={(value) => handleFoodChange(0, 0, 'dietary', value)}
                    />
                  </div>
                </div>
              )}
              {i === 8 && (
                <div className="flex-1" />
              )}
              {/* Additional food items */}
              {categories[0].foods.slice(1).map((food, foodIndex) => {
                const rowOffset = foodIndex * 3;
                if (i === 8 + rowOffset) {
                  return (
                    <div key={`food-${foodIndex}-name`} className="w-full">
                      <Input
                        icon={Utensils}
                        type="text"
                        placeholder="Food name"
                        value={food.name}
                        onChange={e => handleFoodChange(0, foodIndex + 1, 'name', e.target.value)}
                        required
                      />
                    </div>
                  );
                }
                if (i === 9 + rowOffset) {
                  return (
                    <div key={`food-${foodIndex}-desc`} className="w-full">
                      <Input
                        icon={Filter}
                        type="text"
                        placeholder="Description"
                        value={food.description}
                        onChange={e => handleFoodChange(0, foodIndex + 1, 'description', e.target.value)}
                      />
                    </div>
                  );
                }
                if (i === 10 + rowOffset) {
                  return (
                    <div key={`food-${foodIndex}-price`} className="flex-1 flex items-center">
                      <Input
                        icon={Euro}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={food.price}
                        onChange={e => handleFoodChange(0, foodIndex + 1, 'price', e.target.value)}
                        required
                      />
                      <div style={{ width: 48 }}>
                        <DietaryDropdown
                          value={food.dietary}
                          onChange={(value) => handleFoodChange(0, foodIndex + 1, 'dietary', value)}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
              {/* Additional categories */}
              {categories.slice(1).map((category, catIndex) => {
                const rowOffset = catIndex * (3 + category.foods.length * 3);
                if (i === 9 + rowOffset) {
                  return (
                    <div key={`cat-${catIndex}-name`} className="w-full">
                      <Input
                        icon={Layers}
                        type="text"
                        placeholder="Category name"
                        value={category.name}
                        onChange={e => handleCategoryChange(catIndex + 1, e.target.value)}
                        required
                      />
                    </div>
                  );
                }
                category.foods.forEach((food, foodIndex) => {
                  if (i === 10 + rowOffset + foodIndex * 3) {
                    return (
                      <div key={`cat-${catIndex}-food-${foodIndex}-name`} className="w-full">
                        <Input
                          icon={Utensils}
                          type="text"
                          placeholder="Food name"
                          value={food.name}
                          onChange={e => handleFoodChange(catIndex + 1, foodIndex, 'name', e.target.value)}
                          required
                        />
                      </div>
                    );
                  }
                  if (i === 11 + rowOffset + foodIndex * 3) {
                    return (
                      <div key={`cat-${catIndex}-food-${foodIndex}-desc`} className="w-full">
                        <Input
                          icon={Filter}
                          type="text"
                          placeholder="Description"
                          value={food.description}
                          onChange={e => handleFoodChange(catIndex + 1, foodIndex, 'description', e.target.value)}
                        />
                      </div>
                    );
                  }
                  if (i === 12 + rowOffset + foodIndex * 3) {
                    return (
                      <div key={`cat-${catIndex}-food-${foodIndex}-price`} className="flex-1 flex items-center">
                        <Input
                          icon={Euro}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={food.price}
                          onChange={e => handleFoodChange(catIndex + 1, foodIndex, 'price', e.target.value)}
                          required
                        />
                        <div style={{ width: 48 }}>
                          <DietaryDropdown
                            value={food.dietary}
                            onChange={(value) => handleFoodChange(catIndex + 1, foodIndex, 'dietary', value)}
                          />
                        </div>
                      </div>
                    );
                  }
                });
                return null;
              })}
            </div>
            <div style={{ width: 32, minHeight: 48, borderLeft: 'var(--border-hairline-solid)', borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
          </div>
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]" style={{ background: 'var(--background-main)' }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ borderTop: 'var(--border-hairline-solid)' }}>
            <div className="flex w-full" style={{ borderBottom: 'var(--border-hairline-solid)' }}>
              <div style={{ width: 32, minHeight: 48, borderRight: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
              <div style={{ flex: 1, maxWidth: 1024, borderBottom: 'var(--border-hairline-solid)', background: 'var(--background-main)', display: 'flex', alignItems: 'center', minHeight: 48, position: 'relative' }}>
                <Button 
                  variant="secondary" 
                  className="w-12 h-12 flex items-center justify-center p-0"
                  onClick={() => addFood(0)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-12 h-12 flex items-center justify-center p-0"
                  onClick={addCategory}
                >
                  <Layers className="w-4 h-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 h-12"
                  onClick={() => {
                    // TODO: Implement preview functionality
                    console.log('Preview menu clicked')
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview menu
                </Button>
              </div>
              <div style={{ width: 32, minHeight: 48, borderLeft: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
            </div>
            {/* Empty row below */}
            <div className="flex w-full">
              <div style={{ width: 32, height: 32, borderRight: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
              <div className="flex-1" style={{ borderRight: 'var(--border-hairline-solid)', background: 'var(--background-main)' }} />
              <div style={{ width: 32, height: 32, background: 'var(--background-main)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 