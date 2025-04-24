import { Restaurant } from '@/types'
import { MapPin, Clock, DollarSign, ExternalLink, ChefHat } from 'lucide-react'

interface RestaurantCardProps {
  restaurant: Restaurant
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{restaurant.name}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{restaurant.address}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>{restaurant.openNow ? 'Open Now' : 'Closed'}</span>
            </div>
            {restaurant.priceLevel && (
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>{'$'.repeat(restaurant.priceLevel)}</span>
              </div>
            )}
          </div>
          {restaurant.rating && (
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {restaurant.rating} ★
            </div>
          )}
        </div>

        {restaurant.menu && restaurant.menu.length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <ChefHat className="w-4 h-4 mr-1" />
              <span>
                {restaurant.menuSource === 'openmenu' ? 'Menu from OpenMenu' :
                 restaurant.menuSource === 'website' ? 'Menu from Website' :
                 'Sample Menu'}
              </span>
            </div>
            <div className="space-y-2">
              {restaurant.menu.map((item) => (
                <div key={item.id} className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600">${item.price}</span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.dietaryRestrictions && item.dietaryRestrictions.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {item.dietaryRestrictions.map((restriction) => (
                        <span
                          key={restriction}
                          className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800"
                        >
                          {restriction}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500">
            No menu available
          </div>
        )}

        {(restaurant.website || restaurant.googleMapsUrl) && (
          <div className="mt-4 flex gap-2">
            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Visit Website
              </a>
            )}
            {restaurant.googleMapsUrl && (
              <a
                href={restaurant.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <MapPin className="w-4 h-4 mr-1" />
                View on Maps
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 