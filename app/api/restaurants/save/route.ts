import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, address, menu } = data;

    // Generate a unique ID for the restaurant
    const id = uuidv4();

    // Create the restaurant object with the correct menu structure
    const restaurant = {
      id,
      name,
      address,
      coordinates: {
        lat: 0,
        lng: 0
      },
      website: '',
      menu: {
        categories: menu.categories.map((category: any) => ({
          name: category.name,
          items: category.items.map((item: any) => ({
            id: item.id || uuidv4(),
            name: item.name,
            description: item.description || '',
            price: item.price,
            dietaryRestrictions: item.dietaryRestrictions || []
          }))
        }))
      },
      lastUpdated: new Date().toISOString()
    };

    // Read the existing restaurants file
    const restaurantsPath = join(process.cwd(), 'data', 'restaurant-menus.json');
    const restaurantsData = JSON.parse(await readFile(restaurantsPath, 'utf-8'));

    // Add the new restaurant
    restaurantsData.restaurants.push(restaurant);

    // Write the updated restaurants back to the file
    await writeFile(restaurantsPath, JSON.stringify(restaurantsData, null, 2));

    return NextResponse.json({ success: true, restaurant });
  } catch (error) {
    console.error('Error saving restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to save restaurant' },
      { status: 500 }
    );
  }
} 