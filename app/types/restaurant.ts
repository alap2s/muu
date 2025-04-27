export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  dietaryRestrictions?: string[];
  dietaryInfo?: {
    isVegetarian?: boolean;
    isVegan?: boolean;
    hasVegetarianOption?: boolean;
    hasVeganOption?: boolean;
  };
  category?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  website: string;
  menu?: MenuItem[];
} 