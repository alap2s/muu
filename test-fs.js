const fs = require('fs/promises');
const path = require('path');

async function testFileRead() {
  try {
    console.log('Current working directory:', process.cwd());
    const filePath = path.join(process.cwd(), 'data', 'restaurant-menus.json');
    console.log('Attempting to read file:', filePath);
    
    const data = await fs.readFile(filePath, 'utf-8');
    console.log('Successfully read file');
    
    const parsed = JSON.parse(data);
    console.log('Successfully parsed JSON');
    console.log('Number of restaurants:', parsed.restaurants.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFileRead(); 