const admin = require('firebase-admin');

// IMPORTANT: Path to your service account key JSON file
// This file should NOT be public.
// Download it from your Firebase project settings.
const serviceAccount = require('../.firebase/service-account.json');

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function getRestaurantByName(name) {
  try {
    const restaurantsRef = db.collection('restaurants');
    const snapshot = await restaurantsRef.where('name', '==', name).get();

    if (snapshot.empty) {
      console.log(`No restaurant found with the name: ${name}`);
      return null;
    }

    // Assuming there is only one restaurant with this name
    const doc = snapshot.docs[0];
    console.log(`Found restaurant: ${doc.id}`);
    
    const restaurantData = doc.data();
    
    console.log('--- Menu Details ---');
    if (restaurantData.menuCategories && restaurantData.menuCategories.length > 0) {
      restaurantData.menuCategories.forEach(category => {
        console.log(`\nCategory: ${category.name}`);
        if (category.items && category.items.length > 0) {
          category.items.forEach(item => {
            console.log(`  - Item: ${item.name}`);
            console.log(`    Price: ${item.price}`);
            console.log(`    Dietary Restrictions: ${item.dietaryRestrictions.join(', ') || 'None'}`);
          });
        } else {
          console.log('    No items in this category.');
        }
      });
    } else {
      console.log('  No menu categories found for this restaurant.');
    }
    console.log('--------------------');

    return { id: doc.id, ...restaurantData };

  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

// Name of the restaurant to search for
const restaurantName = 'Migas';

getRestaurantByName(restaurantName).then(() => {
    // Disconnect after finishing
    admin.app().delete();
}); 