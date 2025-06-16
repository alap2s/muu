# Restaurant Menu Finder

A lightweight web application that shows you menus of nearby restaurants based on your location. The app features a clean, well-organized menu display with dietary restriction indicators and filtering capabilities.

## Features

- Location-based restaurant discovery using Google Places API
- Clean and organized menu display
- Dietary restriction indicators (vegan, vegetarian)
- Menu filtering by dietary preferences
- Responsive design for all devices
- Real address display using Google Places API
- Menu data stored in Firebase
- Works worldwide with excellent coverage

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
   ```
   
   Get your API keys:
   - Google Places API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Firebase configuration from [Firebase Console](https://console.firebase.google.com/)
   
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Data Sources

The application uses the following data sources:

1. **Google Places API**
   - Primary source for restaurant data
   - Provides location, address, and basic information
   - Excellent coverage worldwide
   - Requires API key

2. **Firebase**
   - Stores menu data
   - Manages restaurant information
   - Handles user data and preferences
   - Requires Firebase configuration

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
   - Firebase configuration variables

Alternatively, you can connect your GitHub repository to Vercel for automatic deployments.

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React (for icons)
- Geolocation API
- Google Places API (restaurant data source)
- Firebase (data storage and management)

## API Usage and Limits

- Google Places API:
  - Free tier includes $200 monthly credit
  - 28,500 free requests per month
  - Excellent coverage worldwide
  - No credit card required for development

## Future Improvements

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