import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    // Get all themes for the shop
    const themesResponse = await admin.rest.resources.Theme.all({
      session,
    });
    
    const themes = themesResponse.data || [];
    const mainTheme = themes.find(theme => theme.role === 'main');
    
    if (!mainTheme) {
      return Response.json({
        success: false,
        error: "No main theme found",
        appEmbedEnabled: false,
        themeId: null
      });
    }
    
    // Check if our app extension is enabled on the main theme
    // We need to check the theme's app extensions
    try {
      const assetsResponse = await admin.rest.resources.Asset.all({
        session,
        theme_id: mainTheme.id,
      });
      
      const assets = assetsResponse.data || [];
      
      // Look for our app extension files
      const appExtensionAssets = assets.filter(asset => 
        asset.key.includes('extensions/') && 
        (asset.key.includes('popup') || asset.key.includes('pop-up'))
      );
      
      // Check if the extension is enabled by looking for the block in theme settings
      const settingsDataAsset = assets.find(asset => asset.key === 'config/settings_data.json');
      let appEmbedEnabled = false;
      let extensionBlocks = [];
      
      if (settingsDataAsset) {
        try {
          const settingsData = JSON.parse(settingsDataAsset.value);
          
          // Check current theme settings for our app blocks
          const currentSettings = settingsData.current || {};
          const blocks = currentSettings.blocks || {};
          
          // Look for our popup extension blocks
          extensionBlocks = Object.values(blocks).filter(block => 
            block.type && (
              block.type.includes('popup') || 
              block.type.includes('pop-up') ||
              block.type.includes(process.env.SHOPIFY_POPUP_ID || 'popup-customizer')
            )
          );
          
          appEmbedEnabled = extensionBlocks.length > 0;
          
        } catch (parseError) {
          console.error('Error parsing settings_data.json:', parseError);
        }
      }
      
      return Response.json({
        success: true,
        appEmbedEnabled,
        themeId: mainTheme.id,
        themeName: mainTheme.name,
        extensionBlocks,
        appExtensionAssets: appExtensionAssets.map(asset => asset.key),
        enableUrl: `https://${session.shop}/admin/themes/${mainTheme.id}/editor?context=apps&template=index&activateAppId=${process.env.SHOPIFY_API_KEY}/popup-customizer`
      });
      
    } catch (assetError) {
      console.error('Error checking theme assets:', assetError);
      return Response.json({
        success: false,
        error: "Failed to check theme assets",
        appEmbedEnabled: false,
        themeId: mainTheme.id,
        themeName: mainTheme.name,
        enableUrl: `https://${session.shop}/admin/themes/${mainTheme.id}/editor?context=apps&template=index&activateAppId=${process.env.SHOPIFY_API_KEY}/popup-customizer`
      });
    }
    
  } catch (error) {
    console.error('Error checking theme extension status:', error);
    return Response.json({
      success: false,
      error: error.message,
      appEmbedEnabled: false,
      themeId: null
    });
  }
};

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "enable") {
      // Get the main theme
      const themesResponse = await admin.rest.resources.Theme.all({
        session,
      });
      
      const themes = themesResponse.data || [];
      const mainTheme = themes.find(theme => theme.role === 'main');
      
      if (!mainTheme) {
        return Response.json({
          success: false,
          error: "No main theme found"
        });
      }
      
      // Return the URL to enable the app extension
      const enableUrl = `https://${session.shop}/admin/themes/${mainTheme.id}/editor?context=apps&template=index&activateAppId=${process.env.SHOPIFY_API_KEY}/popup-customizer`;
      
      return Response.json({
        success: true,
        enableUrl,
        message: "Redirect to theme editor to enable app extension"
      });
    }
    
    return Response.json({
      success: false,
      error: "Invalid action"
    });
    
  } catch (error) {
    console.error('Error in theme extension action:', error);
    return Response.json({
      success: false,
      error: error.message
    });
  }
};