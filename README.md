# Restaurant Menu Finder

A lightweight web application that shows you menus of nearby restaurants based on your location. The app features a clean, well-organized menu display with dietary restriction indicators and filtering capabilities.

## Features

- Location-based restaurant discovery using real-time geolocation
- Clean and organized menu display
- Dietary restriction indicators (vegan, vegetarian)
- Menu filtering by dietary preferences
- Responsive design for all devices
- Real address display using OpenStreetMap
- Restaurant data from Google Places API and OpenStreetMap
- Real menu data from OpenMenu API
- Website menu scraping as fallback
- Sample menus for restaurants without online menus
- Works worldwide with excellent coverage in Europe

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   OPENMENU_API_KEY=your_openmenu_api_key_here
   ```
   
   Get your API keys:
   - Google Places API key from [Google Cloud Console](https://console.cloud.google.com/)
   - OpenMenu API key from [OpenMenu](https://www.openmenu.com/api/)
   
   Note: The app will work without API keys, falling back to OpenStreetMap data and sample menus.

4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Menu Sources

The application uses multiple sources to provide menu data:

1. **OpenMenu API** (Primary)
   - Free tier available
   - Good coverage in some regions
   - Requires API key

2. **Restaurant Websites** (Secondary)
   - Automatically scrapes menus from restaurant websites
   - Works with most restaurant websites
   - No API key required

3. **Sample Menus** (Fallback)
   - Curated menus based on cuisine type
   - Always available
   - No API key required

## Deployment

The easiest way to deploy this application is using [Vercel](https://vercel.com):

1. Create a Vercel account if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy the application:
   ```bash
   vercel
   ```
4. Add your environment variables in the Vercel dashboard:
   - `GOOGLE_PLACES_API_KEY`
   - `OPENMENU_API_KEY`

Alternatively, you can connect your GitHub repository to Vercel for automatic deployments.

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React (for icons)
- Geolocation API
- OpenStreetMap Nominatim API (for address lookup)
- Google Places API (primary restaurant data source)
- OpenStreetMap Overpass API (fallback restaurant data source)
- OpenMenu API (primary menu data source)

## API Usage and Limits

- OpenStreetMap Nominatim: Free to use, please respect the [usage policy](https://operations.osmfoundation.org/policies/nominatim/)
- OpenStreetMap Overpass API: Free to use, no API key required
- Google Places API:
  - Free tier includes $200 monthly credit
  - 28,500 free requests per month
  - Excellent coverage worldwide
  - No credit card required for development
- OpenMenu API:
  - Free tier available
  - Good coverage in some regions
  - Requires registration

The application is designed to work with or without API keys. If no keys are provided, it will use OpenStreetMap data and sample menus, which are completely free.

## Future Improvements

- Integration with more restaurant menu APIs
- User reviews and ratings
- Menu item search
- Price range filtering
- More dietary restriction options
- Caching for better performance
- Progressive Web App (PWA) support
- Integration with food delivery services
- Restaurant photos from Google Places
- Opening hours and busy times
- User reviews and ratings from Google Places 