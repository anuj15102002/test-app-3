// Comprehensive popup test script for browser console
// Copy and paste this into your browser console on the store page

console.log('🔍 Testing Popup System...\n');

// 1. Check if popup container exists
const popupRoot = document.getElementById('popup-root');
const popupOverlay = document.getElementById('custom-popup-overlay');
const popup = document.getElementById('custom-popup');

console.log('1️⃣ DOM Elements Check:');
console.log('popup-root:', popupRoot ? '✅ Found' : '❌ Missing');
console.log('custom-popup-overlay:', popupOverlay ? '✅ Found' : '❌ Missing');
console.log('custom-popup:', popup ? '✅ Found' : '❌ Missing');

// 2. Check if popup functions are loaded
console.log('\n2️⃣ Functions Check:');
console.log('window.closePopup:', typeof window.closePopup === 'function' ? '✅ Loaded' : '❌ Missing');
console.log('window.handleEmailAndSpin:', typeof window.handleEmailAndSpin === 'function' ? '✅ Loaded' : '❌ Missing');

// 3. Check localStorage state
console.log('\n3️⃣ LocalStorage State:');
console.log('popup-shown:', localStorage.getItem('popup-shown') || 'null');
console.log('popup-last-shown:', localStorage.getItem('popup-last-shown') || 'null');
console.log('popup-ask-later:', localStorage.getItem('popup-ask-later') || 'null');

// 4. Clear localStorage and test
console.log('\n4️⃣ Clearing localStorage...');
localStorage.removeItem('popup-shown');
localStorage.removeItem('popup-last-shown');
localStorage.removeItem('popup-ask-later');
console.log('✅ localStorage cleared');

// 5. Test popup display manually
console.log('\n5️⃣ Manual Popup Test:');
if (popupOverlay) {
  console.log('Attempting to show popup manually...');
  popupOverlay.style.display = 'flex';
  console.log('✅ Popup should now be visible');
  
  // Hide it after 3 seconds
  setTimeout(() => {
    popupOverlay.style.display = 'none';
    console.log('✅ Popup hidden after 3 seconds');
  }, 3000);
} else {
  console.log('❌ Cannot test popup - overlay element not found');
}

// 6. Check if popup script is loaded
console.log('\n6️⃣ Script Loading Check:');
console.log('window.__popupAlreadyLoaded:', window.__popupAlreadyLoaded ? '✅ Script loaded' : '❌ Script not loaded');

// 7. Test API endpoint
console.log('\n7️⃣ Testing API Endpoint...');
const shopDomain = window.Shopify?.shop || window.location.hostname;
const metaAppUrl = document.querySelector('meta[name="shopify-app-url"]')?.content;
const apiUrl = `${metaAppUrl}/api/public/popup-config?shop=${shopDomain}`;

console.log('Shop domain:', shopDomain);
console.log('Meta app URL:', metaAppUrl);
console.log('API URL:', apiUrl);

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Response:', data);
    if (data.config) {
      console.log('✅ Popup configuration loaded successfully');
      console.log('Config details:', {
        type: data.config.type,
        isActive: data.config.isActive,
        frequency: data.config.frequency,
        displayDelay: data.config.displayDelay,
        exitIntent: data.config.exitIntent
      });
    } else {
      console.log('❌ No popup configuration in response');
    }
  })
  .catch(error => {
    console.log('❌ API Error:', error);
  });

// 8. Instructions
console.log('\n8️⃣ Next Steps:');
console.log('1. If popup showed manually, the issue is with the automatic trigger');
console.log('2. If popup didn\'t show manually, the extension isn\'t properly installed');
console.log('3. Refresh the page after clearing localStorage to test automatic popup');
console.log('4. Check if you see any JavaScript errors in the console');