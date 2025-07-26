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

    // Fetch Collections using GraphQL
    try {
      const collectionsQuery = `
        query getCollections($first: Int!) {
          collections(first: $first) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }
      `;
      
      const collectionsResponse = await admin.graphql(collectionsQuery, {
        variables: { first: 50 }
      });
      const collectionsData = await collectionsResponse.json();
      
      // Check for GraphQL errors
      if (collectionsData.errors) {
        console.error('GraphQL errors in collections query:', collectionsData.errors);
      }
      
      if (collectionsData.data?.collections?.edges) {
        storefrontPages.collections = collectionsData.data.collections.edges.map(edge => ({
          type: 'collection',
          label: edge.node.title,
          value: `/collections/${edge.node.handle}`,
          id: edge.node.id
        }));
        
        // Add "All Collections" option
        storefrontPages.collections.unshift({
          type: 'collections',
          label: 'All Collections',
          value: '/collections/*'
        });
      }
      
    } catch (error) {
      console.error('Error fetching collections:', error);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
    }

    // Fetch Products using GraphQL
    try {
      const productsQuery = `
        query getProducts($first: Int!) {
          products(first: $first, query: "status:active") {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }
      `;
      
      const productsResponse = await admin.graphql(productsQuery, {
        variables: { first: 20 }
      });
      const productsData = await productsResponse.json();
      
      // Check for GraphQL errors
      if (productsData.errors) {
        console.error('GraphQL errors in products query:', productsData.errors);
      }
      
      if (productsData.data?.products?.edges) {
        storefrontPages.products = productsData.data.products.edges.map(edge => ({
          type: 'product',
          label: edge.node.title,
          value: `/products/${edge.node.handle}`,
          id: edge.node.id
        }));
        
        // Add "All Products" option
        storefrontPages.products.unshift({
          type: 'products',
          label: 'All Products',
          value: '/products/*'
        });
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
    }

    // Fetch Custom Pages using GraphQL
    try {
      const pagesQuery = `
        query getPages($first: Int!) {
          pages(first: $first) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }
      `;
      
      const pagesResponse = await admin.graphql(pagesQuery, {
        variables: { first: 50 }
      });
      const pagesData = await pagesResponse.json();
      
      // Check for GraphQL errors
      if (pagesData.errors) {
        console.error('GraphQL errors in pages query:', pagesData.errors);
      }
      
      if (pagesData.data?.pages?.edges) {
        storefrontPages.pages = pagesData.data.pages.edges.map(edge => ({
          type: 'page',
          label: edge.node.title,
          value: `/pages/${edge.node.handle}`,
          id: edge.node.id
        }));
      }
      
    } catch (error) {
      console.error('Error fetching pages:', error);
      if (error.graphQLErrors) {
        console.error('GraphQL errors:', error.graphQLErrors);
      }
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