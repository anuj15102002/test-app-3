// Test script to check if discount creation works
// Run this with: node test-discount-creation.js

const testDiscountCreation = async () => {
  try {
    // Test the API endpoint directly
    const response = await fetch('https://syntax-michigan-replace-tft.trycloudflare.com/api/public/generate-discount?shop=appdevelopmentst.myshopify.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'test@example.com',
        discountType: 'percentage',
        discountValue: '10',
        shop: 'appdevelopmentst.myshopify.com'
      })
    });

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success) {
      console.log('\n✅ Discount Code Generated:', data.discountCode);
      console.log('🔧 Shopify Created:', data.shopifyCreated);
      
      if (data.shopifyCreated) {
        console.log('🎉 SUCCESS: Discount code was created in Shopify automatically!');
        console.log('💡 You can test this code at checkout immediately.');
      } else {
        console.log('⚠️  WARNING: Discount code was NOT created in Shopify.');
        console.log('📝 You need to create it manually in Shopify Admin:');
        console.log(`   1. Go to Shopify Admin > Discounts`);
        console.log(`   2. Create new discount code: ${data.discountCode}`);
        console.log(`   3. Set discount: ${data.discountValue}% off`);
        console.log(`   4. Set usage limit: 1 per customer`);
      }
    } else {
      console.log('❌ ERROR:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testDiscountCreation();