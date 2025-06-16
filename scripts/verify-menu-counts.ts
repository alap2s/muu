import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration (same as migration script) ---
const SERVICE_ACCOUNT_KEY_FILENAME = 'muuappberlin-firebase-adminsdk.json';
const DATABASE_URL = 'https://muuappberlin.firebaseio.com';

// --- Interfaces for local JSON data (simplified for counting) ---
interface MenuItemJson {
  id: string; // or any unique identifier for an item
  // We only need to know it's an item to count it.
  // Other fields like name, price, category, dietaryRestrictions are not needed for counting.
}

interface JsonMenuCategory {
  name: string;
  items: MenuItemJson[];
}

interface MenuObjectWithCategories {
  categories: JsonMenuCategory[];
}

interface RestaurantJson {
  id: string; // This is the originalJsonId in Firestore
  name: string;
  menu?: MenuItemJson[] | MenuObjectWithCategories; // Menu can be flat array or object with categories
  categories?: JsonMenuCategory[]; // Top-level categories (like Library Bar)
}

// --- Interfaces for Firestore data (simplified for counting) ---
interface MenuItemFirestore {
  id: string;
  // Other fields not needed for counting
}

interface MenuCategoryFirestore {
  name: string;
  items: MenuItemFirestore[];
}

async function verifyMenuCounts() {
  console.log('Starting menu count verification...');

  try {
    // Initialize Firebase Admin SDK
    const serviceAccountPath = path.join(__dirname, SERVICE_ACCOUNT_KEY_FILENAME);
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('ERROR: Service account key file not found at:', serviceAccountPath);
      return;
    }
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: DATABASE_URL,
    }, 'verifierApp'); // Use a unique app name for this instance

    const db = admin.app('verifierApp').firestore(); // Get Firestore from the named app
    console.log('Firebase Admin SDK (verifierApp) initialized successfully.');

    // 1. Read and process local JSON data
    const jsonFilePath = path.join(__dirname, '..', 'data', 'restaurant-menus.json');
    if (!fs.existsSync(jsonFilePath)) {
      console.error('ERROR: restaurant-menus.json not found at:', jsonFilePath);
      return;
    }
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    const parsedJson = JSON.parse(jsonData);
    const localRestaurantsArray: RestaurantJson[] = parsedJson.restaurants;

    const localRestaurantCounts: Map<string, { name: string; count: number }> = new Map();

    console.log(`\nProcessing ${localRestaurantsArray.length} restaurants from local JSON...`);
    for (const restaurant of localRestaurantsArray) {
      let itemCount = 0;
      if (restaurant.categories && Array.isArray(restaurant.categories)) {
        // Case 1: Top-level 'categories' array (e.g., Library Bar)
        for (const category of restaurant.categories) {
          itemCount += (category.items || []).length;
        }
      } else if (restaurant.menu) {
        if (Array.isArray(restaurant.menu)) {
          // Case 2: 'menu' is a flat array of items
          itemCount = restaurant.menu.length;
        } else if (typeof restaurant.menu === 'object' && (restaurant.menu as MenuObjectWithCategories).categories) {
          // Case 3: 'menu' is an object containing a 'categories' array (e.g., Wen Cheng)
          const menuObject = restaurant.menu as MenuObjectWithCategories;
          for (const category of (menuObject.categories || [])) {
            itemCount += (category.items || []).length;
          }
        }
      }
      localRestaurantCounts.set(restaurant.id, { name: restaurant.name, count: itemCount });
    }
    console.log('Finished processing local JSON data.');

    // 2. Fetch and process Firestore data
    console.log('\nFetching restaurants from Firestore...');
    const firestoreRestaurantsSnapshot = await db.collection('restaurants').get();
    const firestoreRestaurantCounts: Map<string, { name: string; count: number; firestoreDocId: string }> = new Map();

    console.log(`Processing ${firestoreRestaurantsSnapshot.size} restaurants from Firestore...`);
    firestoreRestaurantsSnapshot.forEach(doc => {
      const data = doc.data() as { 
        originalJsonId: string; 
        name: string; 
        menuCategories?: MenuCategoryFirestore[] 
      };
      let itemCount = 0;
      if (data.menuCategories && Array.isArray(data.menuCategories)) {
        for (const category of data.menuCategories) {
          itemCount += (category.items || []).length;
        }
      }
      if (data.originalJsonId) {
        firestoreRestaurantCounts.set(data.originalJsonId, { 
          name: data.name, 
          count: itemCount, 
          firestoreDocId: doc.id 
        });
      } else {
        console.warn(`Firestore document ${doc.id} (Name: ${data.name}) is missing originalJsonId. Cannot compare.`);
      }
    });
    console.log('Finished processing Firestore data.');

    // 3. Compare and report
    console.log('\n--- Verification Report ---');
    let discrepanciesFound = false;
    let missingInFirestore = 0;
    let missingInLocal = 0;

    console.log(`Total local restaurants processed: ${localRestaurantCounts.size}`);
    console.log(`Total Firestore restaurants processed (with originalJsonId): ${firestoreRestaurantCounts.size}`);

    // Check for discrepancies for restaurants present in both
    for (const [jsonId, localData] of localRestaurantCounts.entries()) {
      const firestoreData = firestoreRestaurantCounts.get(jsonId);
      if (firestoreData) {
        if (localData.count !== firestoreData.count) {
          console.error(`DISCREPANCY for ${localData.name} (ID: ${jsonId}):`);
          console.error(`  Local JSON item count: ${localData.count}`);
          console.error(`  Firestore item count: ${firestoreData.count} (Doc ID: ${firestoreData.firestoreDocId})`);
          discrepanciesFound = true;
        } else {
          // console.log(`MATCH for ${localData.name} (ID: ${jsonId}): ${localData.count} items.`);
        }
      } else {
        console.warn(`MISSING in Firestore: ${localData.name} (ID: ${jsonId}) was in local JSON but not found in Firestore.`);
        missingInFirestore++;
        discrepanciesFound = true;
      }
    }

    // Check for restaurants in Firestore but not in local (shouldn't happen if migration was from local)
    for (const [jsonId, firestoreData] of firestoreRestaurantCounts.entries()) {
      if (!localRestaurantCounts.has(jsonId)) {
        console.warn(`MISSING in Local JSON: ${firestoreData.name} (ID: ${jsonId}, Firestore Doc ID: ${firestoreData.firestoreDocId}) was in Firestore but not found in local JSON map.`);
        missingInLocal++;
        discrepanciesFound = true;
      }
    }

    if (!discrepanciesFound) {
      console.log('\nSUCCESS: All menu item counts match between local JSON and Firestore!');
    } else {
      console.error('\nVERIFICATION FAILED: Discrepancies found.');
      if (missingInFirestore > 0) console.error(`  ${missingInFirestore} restaurant(s) missing in Firestore.`);
      if (missingInLocal > 0) console.error(`  ${missingInLocal} restaurant(s) missing in local JSON (unexpected).`);
    }

  } catch (error) {
    console.error('Error during verification process:', error);
  }
}

verifyMenuCounts().then(() => {
  console.log('\nVerification script finished.');
  // Explicitly exit if running as a script, in case of hanging async operations
  process.exit(0);
}).catch((error) => {
  console.error('Unhandled error in verification script:', error);
  process.exit(1);
}); 