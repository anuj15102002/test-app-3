import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    const storefrontPages = {
      collections: [],
      products: [],
      pages: [],
      staticPages: [
        { type: 'homepage', label: 'Homepage', value: '/' },
        { type: 'cart', label: 'Cart Page', value: '/cart' },
        { type: 'search', label: 'Search Page', value: '/search' },
        { type: 'account', label: 'Account Pages', value: '/account/*' },
      ]
    };

    // Fetch Collections
    try {
      const collectionsResponse = await admin.rest.resources.Collection.all({
        session,
        limit: 50, // Adjust as needed
        fields: 'id,title,handle'
      });
      
      storefrontPages.collections = collectionsResponse.data.map(collection => ({
        type: 'collection',
        label: collection.title,
        value: `/collections/${collection.handle}`,
        id: collection.id
      }));
      
      // Add "All Collections" option
      storefrontPages.collections.unshift({
        type: 'collections',
        label: 'All Collections',
        value: '/collections/*'
      });
      
    } catch (error) {
      console.error('Error fetching collections:', error);
    }

    // Fetch Products (limit to recent/popular ones to avoid too many options)
    try {
      const productsResponse = await admin.rest.resources.Product.all({
        session,
        limit: 20, // Limit to avoid overwhelming UI
        fields: 'id,title,handle',
        status: 'active'
      });
      
      storefrontPages.products = productsResponse.data.map(product => ({
        type: 'product',
        label: product.title,
        value: `/products/${product.handle}`,
        id: product.id
      }));
      
      // Add "All Products" option
      storefrontPages.products.unshift({
        type: 'products',
        label: 'All Products',
        value: '/products/*'
      });
      
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    // Fetch Custom Pages
    try {
      const pagesResponse = await admin.rest.resources.Page.all({
        session,
        limit: 50,
        fields: 'id,title,handle'
      });
      
      storefrontPages.pages = pagesResponse.data.map(page => ({
        type: 'page',
        label: page.title,
        value: `/pages/${page.handle}`,
        id: page.id
      }));
      
    } catch (error) {
      console.error('Error fetching pages:', error);
    }

    return json({
      success: true,
      storefrontPages
    });

  } catch (error) {
    console.error('Error in storefront-pages API:', error);
    return json({
      success: false,
      error: error.message,
      storefrontPages: {
        collections: [{ type: 'collections', label: 'All Collections', value: '/collections/*' }],
        products: [{ type: 'products', label: 'All Products', value: '/products/*' }],
        pages: [],
        staticPages: [
          { type: 'homepage', label: 'Homepage', value: '/' },
          { type: 'cart', label: 'Cart Page', value: '/cart' }
        ]
      }
    });
  }
};