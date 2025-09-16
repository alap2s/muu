import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getPlaceIdFromUrl(url: string, apiKey: string): Promise<string | null> {
    try {
        // Attempt 1: Look for a standard Place ID (ChIJ...)
        const placeIdMatch = url.match(/ChIJ[A-Za-z0-9_-]+/);
        if (placeIdMatch && placeIdMatch[0]) {
            console.log("Found Place ID via regex:", placeIdMatch[0]);
            return placeIdMatch[0];
        }

        // Attempt 2: If no Place ID, parse name and coordinates and use Find Place API
        const placeNameMatch = url.match(/place\/([^\/@]+)/);
        const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

        if (placeNameMatch && placeNameMatch[1] && coordsMatch && coordsMatch[1] && coordsMatch[2]) {
            const placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
            const lat = coordsMatch[1];
            const lng = coordsMatch[2];
            console.log(`No Place ID found. Searching for "${placeName}" near ${lat},${lng}`);

            const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&location=${lat},${lng}&radius=500&type=restaurant&key=${apiKey}`;
            
            const response = await fetch(textSearchUrl);
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const foundPlaceId = data.results[0].place_id;
                console.log("Found Place ID via Text Search API:", foundPlaceId);
                return foundPlaceId;
            } else {
                console.error("Text Search API failed. Response:", JSON.stringify(data, null, 2));
            }
        }

        console.log("Could not determine Place ID from URL:", url);
        return null;
    } catch (error) {
        console.error("Error in getPlaceIdFromUrl:", error);
        return null;
    }
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const googleMapsUrl = requestUrl.searchParams.get('url')

    if (!googleMapsUrl) {
      return NextResponse.json({ error: 'Missing Google Maps URL' }, { status: 400 })
    }

    // Resolve short URLs
    let finalUrl = googleMapsUrl;
    if (googleMapsUrl.includes('maps.app.goo.gl')) {
      try {
        const res = await fetch(googleMapsUrl, { redirect: 'follow' });
        finalUrl = res.url;
      } catch (error) {
        console.error("Error resolving short URL:", error);
        return NextResponse.json({ error: 'Could not resolve the provided URL' }, { status: 500 });
      }
    }
    
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      throw new Error("Missing Google API Key")
    }

    const placeId = await getPlaceIdFromUrl(finalUrl, apiKey);

    if (!placeId) {
      return NextResponse.json({ error: 'Could not extract Place ID from the URL' }, { status: 400 })
    }

    const fields = 'name,formatted_address,types'
    const placesApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`

    const response = await fetch(placesApiUrl)
    const data = await response.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || 'Failed to fetch place details' }, { status: 500 })
    }

    const { name, formatted_address, types } = data.result
    
    // Filter and format cuisine types
    const cuisineTypes = types.filter((type: string) => 
        !['point_of_interest', 'establishment', 'food', 'restaurant'].includes(type)
    ).map((type: string) => type.replace(/_/g, ' '));
    
    const cuisine = cuisineTypes.length > 0 ? cuisineTypes.join(', ') : 'Not specified';

    return NextResponse.json({
      name,
      address: formatted_address,
      cuisine,
    })

  } catch (error) {
    console.error('Error in place-details API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
