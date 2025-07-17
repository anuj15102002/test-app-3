// Clear popup localStorage to test popup display
// Run this in your browser console on the store page

console.log('🧹 Clearing popup localStorage...');

// Clear all popup-related localStorage items
localStorage.removeItem('popup-shown');
localStorage.removeItem('popup-last-shown');
localStorage.removeItem('popup-ask-later');

console.log('✅ Popup localStorage cleared!');
console.log('🔄 Refresh the page to see the popup');

// Also log current localStorage state
console.log('Current localStorage state:');
console.log('popup-shown:', localStorage.getItem('popup-shown'));
console.log('popup-last-shown:', localStorage.getItem('popup-last-shown'));
console.log('popup-ask-later:', localStorage.getItem('popup-ask-later'));