// Debug script to check database and R2 state
// Run with: node debug-database.js

const API_BASE = 'https://preview.loverlay.pages.dev';

async function debugDatabase() {
  console.log('🔍 Debugging database and R2 state...\n');

  // Test 1: Check catalog API
  try {
    console.log('📋 Test 1: Catalog API');
    const catalogResponse = await fetch(`${API_BASE}/api/sets?catalog=1`);
    if (!catalogResponse.ok) {
      throw new Error(`HTTP ${catalogResponse.status}`);
    }
    const catalog = await catalogResponse.json();
    console.log(`✅ Catalog: ${catalog.categories?.length || 0} categories`);
    console.log(`📊 Sets by category:`, Object.keys(catalog.setsByCategory || {}).map(cat => `${cat}: ${catalog.setsByCategory[cat]?.length || 0} sets`));

    // Check specific sets
    for (const [category, sets] of Object.entries(catalog.setsByCategory || {})) {
      sets.forEach((set: any) => {
        console.log(`  - ${set.title}: ${set.previewOverlays?.length || 0} preview overlays`);
        set.previewOverlays?.forEach((overlay: any) => {
          console.log(`    * ${overlay.kind}: ${overlay.value}`);
        });
      });
    }
  } catch (error) {
    console.error(`❌ Catalog test failed: ${error.message}`);
  }

  // Test 2: Check files API
  try {
    console.log('\n🖼️  Test 2: Files API');
    // Try to list files (this might not work, but let's see)
    const filesResponse = await fetch(`${API_BASE}/api/files/`);
    console.log(`Files API status: ${filesResponse.status}`);
  } catch (error) {
    console.error(`❌ Files API test failed: ${error.message}`);
  }

  // Test 3: Check specific file
  try {
    console.log('\n📁 Test 3: Specific file access');
    const fileResponse = await fetch(`${API_BASE}/api/files/overlays/oKqxPPmqlVBkiQmfq0dpo.jpg`);
    console.log(`File access status: ${fileResponse.status}`);
    if (fileResponse.ok) {
      console.log(`✅ File exists and accessible`);
    } else {
      console.log(`❌ File not accessible: ${fileResponse.status}`);
    }
  } catch (error) {
    console.error(`❌ File access test failed: ${error.message}`);
  }

  console.log('\n🎯 Debug completed!');
}

// Run debug
debugDatabase().catch(console.error);
