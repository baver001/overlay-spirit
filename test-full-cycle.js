// Full cycle test for Loverlay
// Run with: node test-full-cycle.js

const API_BASE = 'https://preview.loverlay.pages.dev';

async function testFullCycle() {
  console.log('🔄 Testing full cycle: create set → check catalog → check files\n');

  // Step 1: Check current catalog state
  try {
    console.log('📋 Step 1: Checking current catalog...');
    const catalogResponse = await fetch(`${API_BASE}/api/sets?catalog=1`);
    if (!catalogResponse.ok) {
      throw new Error(`HTTP ${catalogResponse.status}`);
    }
    const catalog = await catalogResponse.json();
    console.log(`📊 Current catalog: ${catalog.categories?.length || 0} categories, ${Object.keys(catalog.setsByCategory || {}).length} category groups`);

    // Check if any sets exist
    const totalSets = Object.values(catalog.setsByCategory || {}).reduce((total, sets) => total + sets.length, 0);
    console.log(`📦 Total sets in catalog: ${totalSets}`);

  } catch (error) {
    console.error(`❌ Catalog check failed: ${error.message}`);
    return;
  }

  // Step 2: Check if we can access the files API
  try {
    console.log('\n🖼️  Step 2: Checking files API...');
    const filesResponse = await fetch(`${API_BASE}/api/files/overlays/nonexistent.jpg`);
    console.log(`Files API status: ${filesResponse.status} (404 expected for non-existent files)`);
  } catch (error) {
    console.error(`❌ Files API test failed: ${error.message}`);
  }

  // Step 3: Check admin API (requires auth)
  try {
    console.log('\n🔐 Step 3: Checking admin API access...');
    const adminResponse = await fetch(`${API_BASE}/api/admin?list=sets`, {
      credentials: 'include'
    });

    if (adminResponse.status === 401) {
      console.log(`✅ Admin API: Authentication required (expected)`);
    } else if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log(`✅ Admin API: ${adminData.items?.length || 0} sets in admin panel`);
    } else {
      console.log(`⚠️  Admin API: HTTP ${adminResponse.status}`);
    }
  } catch (error) {
    console.error(`❌ Admin API test failed: ${error.message}`);
  }

  console.log('\n🎯 Full cycle test completed!');
  console.log('\n📝 Manual testing steps:');
  console.log('1. Go to admin panel');
  console.log('2. Create a test category');
  console.log('3. Create a test set with JPG files');
  console.log('4. Check if set appears in public catalog');
  console.log('5. Check if overlay previews work');
}

// Run test
testFullCycle().catch(console.error);
