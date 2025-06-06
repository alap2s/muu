"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
// IMPORTANT: 1. Download your service account key JSON file from Firebase console.
//            2. Place it in this 'scripts' folder.
//            3. Rename it (e.g., to 'muuappberlin-firebase-adminsdk.json').
//            4. Update the filename in the line below.
//            5. Add this key file to your .gitignore file!
const SERVICE_ACCOUNT_KEY_FILENAME = 'muuappberlin-firebase-adminsdk.json'; // <--- CHANGE THIS
const DATABASE_URL = 'https://muuappberlin.firebaseio.com'; // Or your specific database URL if different
async function migrateData() {
    try {
        const serviceAccountPath = path.join(__dirname, SERVICE_ACCOUNT_KEY_FILENAME);
        if (!fs.existsSync(serviceAccountPath)) {
            console.error('ERROR: Service account key file not found at:', serviceAccountPath);
            console.error('Please follow the instructions at the top of this script to download and place your service account key.');
            return;
        }
        const serviceAccount = require(serviceAccountPath); // Dynamically require after checking existence
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: DATABASE_URL,
        });
        const db = admin.firestore();
        db.settings({ ignoreUndefinedProperties: true });
        console.log('Firebase Admin SDK initialized successfully.');
        const jsonFilePath = path.join(__dirname, '..', // Go up one level from 'scripts' to project root
        'data', 'restaurant-menus.json');
        if (!fs.existsSync(jsonFilePath)) {
            console.error('ERROR: restaurant-menus.json not found at:', jsonFilePath);
            return;
        }
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        console.log(`jsonData length: ${jsonData.length}`);
        console.log(`jsonData snippet (first 100 chars): ${jsonData.substring(0, 100)}`); // Log a snippet
        const parsedJson = JSON.parse(jsonData);
        const restaurantsFromJson = parsedJson.restaurants; // Access the nested array
        console.log(`Found ${restaurantsFromJson ? restaurantsFromJson.length : 'undefined/null'} restaurants after parse.`);
        const restaurantsCollection = db.collection('restaurants');
        let migratedCount = 0;
        let skippedCount = 0;
        for (const restaurant of restaurantsFromJson) {
            console.log(`Processing restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
            const existingDocQuery = await restaurantsCollection.where('originalJsonId', '==', restaurant.id).limit(1).get();
            if (!existingDocQuery.empty) {
                console.log(`  Restaurant with originalJsonId ${restaurant.id} already exists in Firestore. Skipping.`);
                skippedCount++;
                continue;
            }
            let gpsPoint = undefined;
            if (restaurant.coordinates && typeof restaurant.coordinates.lat === 'number' && isFinite(restaurant.coordinates.lat)) {
                let lonValue = undefined;
                if (typeof restaurant.coordinates.lng === 'number' && isFinite(restaurant.coordinates.lng)) {
                    lonValue = restaurant.coordinates.lng;
                }
                else if (typeof restaurant.coordinates.lon === 'number' && isFinite(restaurant.coordinates.lon)) {
                    lonValue = restaurant.coordinates.lon; // Fallback to lon if lng is not present/valid
                }
                if (lonValue !== undefined && restaurant.coordinates.lat >= -90 && restaurant.coordinates.lat <= 90 && lonValue >= -180 && lonValue <= 180) {
                    gpsPoint = new admin.firestore.GeoPoint(restaurant.coordinates.lat, lonValue);
                    console.log(`  Successfully created GeoPoint from coordinates for ${restaurant.name}: lat ${restaurant.coordinates.lat}, lng/lon ${lonValue}`);
                }
            }
            // Fallback to restaurant.latitude and restaurant.longitude if coordinates weren't usable or present
            if (!gpsPoint && restaurant.latitude !== undefined && restaurant.longitude !== undefined &&
                typeof restaurant.latitude === 'number' && isFinite(restaurant.latitude) &&
                typeof restaurant.longitude === 'number' && isFinite(restaurant.longitude) &&
                restaurant.latitude >= -90 && restaurant.latitude <= 90 &&
                restaurant.longitude >= -180 && restaurant.longitude <= 180) {
                gpsPoint = new admin.firestore.GeoPoint(restaurant.latitude, restaurant.longitude);
                console.log(`  Successfully created GeoPoint from latitude/longitude fields for ${restaurant.name}: lat ${restaurant.latitude}, lng ${restaurant.longitude}`);
            }
            // Log a warning if coordinate data is present but couldn't be used and no gpsPoint was created yet
            if (!gpsPoint && (restaurant.coordinates || restaurant.latitude !== undefined || restaurant.longitude !== undefined)) {
                console.log(`  Warning: Restaurant "${restaurant.name}" has GPS data but it's invalid or incomplete. Latitude: ${restaurant.latitude}, Longitude: ${restaurant.longitude}, Coordinates: ${JSON.stringify(restaurant.coordinates)}. GPS point will not be created.`);
            }
            else if (!gpsPoint) {
                console.log(`  No usable GPS data found for restaurant "${restaurant.name}".`);
            }
            let menuCategories = [];
            // Case 1: Top-level 'categories' array (e.g., Library Bar)
            if (restaurant.categories && Array.isArray(restaurant.categories) && restaurant.categories.length > 0) {
                console.log(`  Restaurant ${restaurant.name} has top-level 'categories'. Processing directly.`);
                menuCategories = restaurant.categories.map((cat) => ({
                    name: cat.name,
                    items: (cat.items || []).map((item) => ({
                        id: item.id,
                        name: item.name,
                        description: item.description || '',
                        price: typeof item.price === 'string' ? parseFloat(item.price) : (typeof item.price === 'number' ? item.price : 0),
                        category: cat.name,
                        dietaryRestrictions: item.dietaryRestrictions || [],
                    }))
                }));
            }
            // Case 2: 'menu' is an object containing a 'categories' array (e.g., Wen Cheng, Sticks'n'Sushi)
            else if (restaurant.menu &&
                typeof restaurant.menu === 'object' &&
                !Array.isArray(restaurant.menu) && // Ensures it's not MenuItemJson[]
                restaurant.menu.categories &&
                Array.isArray(restaurant.menu.categories)) {
                console.log(`  Restaurant ${restaurant.name} has 'menu.categories'. Processing nested categories.`);
                const menuAsObject = restaurant.menu;
                if (menuAsObject.categories.length > 0) {
                    menuCategories = menuAsObject.categories.map((cat) => ({
                        name: cat.name,
                        items: (cat.items || []).map((item) => ({
                            id: item.id,
                            name: item.name,
                            description: item.description || '',
                            price: typeof item.price === 'string' ? parseFloat(item.price) : (typeof item.price === 'number' ? item.price : 0),
                            category: cat.name,
                            dietaryRestrictions: item.dietaryRestrictions || [],
                        }))
                    }));
                }
                else {
                    console.log(`  Restaurant ${restaurant.name} has 'menu.categories' but the array is empty.`);
                }
            }
            // Case 3: 'menu' is a flat array of items that need grouping
            else if (restaurant.menu && Array.isArray(restaurant.menu) && restaurant.menu.length > 0) {
                console.log(`  Restaurant ${restaurant.name} has a flat 'menu' array. Grouping items by category.`);
                const groupedMenu = {};
                // Type assertion for clarity, though Array.isArray already helped
                const menuAsArray = restaurant.menu;
                menuAsArray.forEach((item) => {
                    const categoryName = item.category || 'Uncategorized';
                    if (!groupedMenu[categoryName]) {
                        groupedMenu[categoryName] = [];
                    }
                    groupedMenu[categoryName].push({
                        id: item.id,
                        name: item.name,
                        description: item.description || '',
                        price: typeof item.price === 'string' ? parseFloat(item.price) : (typeof item.price === 'number' ? item.price : 0),
                        category: categoryName,
                        dietaryRestrictions: item.dietaryRestrictions || [],
                    });
                });
                menuCategories = Object.entries(groupedMenu).map(([catName, items]) => ({
                    name: catName,
                    items: items,
                }));
            }
            else {
                console.log(`  Restaurant ${restaurant.name} has no processable menu structure (checked top-level categories, menu.categories, and flat menu array). menuCategories will be empty.`);
            }
            // Ensure price is a number, default to 0 if not parseable or missing.
            // This is now handled within each case above more specifically.
            const firestoreRestaurantData = {
                name: restaurant.name,
                address: restaurant.address,
                website: restaurant.website || '',
                originalJsonId: restaurant.id,
                menuSource: restaurant.menuSource || 'database',
                rating: restaurant.rating !== undefined ? restaurant.rating : undefined,
                totalRatings: restaurant.totalRatings !== undefined ? restaurant.totalRatings : undefined,
                notes: restaurant.notes || '',
                menuCategories: menuCategories,
            };
            if (gpsPoint) {
                firestoreRestaurantData.gps = gpsPoint;
            }
            try {
                await restaurantsCollection.add(firestoreRestaurantData);
                console.log(`  Successfully added ${restaurant.name} to Firestore.`);
                migratedCount++;
            }
            catch (error) {
                console.error(`  Error adding ${restaurant.name} to Firestore:`, error);
            }
        }
        console.log('\nMigration Complete!');
        console.log(`Successfully migrated ${migratedCount} new restaurants.`);
        console.log(`Skipped ${skippedCount} already existing restaurants.`);
    }
    catch (error) {
        console.error('Error during migration process:', error);
    }
}
migrateData().then(() => {
    console.log('Migration script finished.');
}).catch((error) => {
    console.error('Unhandled error in migration script:', error);
});
