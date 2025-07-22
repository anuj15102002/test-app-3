(() => {
  // Prevent duplicate loading
  if (window.__popupAlreadyLoaded) return;
  window.__popupAlreadyLoaded = true;

  let popupConfig = null;
  let popupShown = false;
  let exitIntentTriggered = false;
  let sessionId = null;
  let applicationUrl = "https://differ-sql-gb-parade.trycloudflare.com";

  // Generate session ID for tracking
  sessionId =
    "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

  console.log(popupConfig);

  // Utils
  const getShopDomain = () => window.Shopify?.shop || window.location.hostname;

  // Analytics tracking function
  const trackEvent = async (eventType, data = {}) => {
    try {
      const shopDomain = getShopDomain();
      const metaAppUrl = document.querySelector(
        'meta[name="shopify-app-url"]',
      )?.content;

      let endpoint;
      if (metaAppUrl && metaAppUrl.trim() !== "") {
        endpoint = `${metaAppUrl}/api/public/analytics`;
      } else {
        endpoint = `${applicationUrl}/api/public/analytics`;
      }

      const formData = new FormData();
      formData.append("shop", shopDomain);
      formData.append("eventType", eventType);
      formData.append("sessionId", sessionId);

      // Add optional data
      if (data.email) formData.append("email", data.email);
      if (data.discountCode) formData.append("discountCode", data.discountCode);
      if (data.prizeLabel) formData.append("prizeLabel", data.prizeLabel);
      if (data.metadata)
        formData.append("metadata", JSON.stringify(data.metadata));

      console.log(`Tracking event: ${eventType}`, data);

      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      await fetch(`${endpoint}?shop=${encodeURIComponent(shopDomain)}`, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      // Silently handle analytics failures - don't spam console
      if (error.name !== "AbortError") {
        console.debug("Analytics tracking unavailable:", error.message);
      }
    }
  }; //trackEvent ends

  const fetchPopupConfig = async () => {
    console.log("Starting popup config fetch...");

    const shopDomain = getShopDomain();
    console.log("Shop domain:", shopDomain);

    // Get app URL from meta tag (set by your app)
    const metaAppUrl = document.querySelector(
      'meta[name="shopify-app-url"]',
    )?.content;
    console.log("Meta app URL:", metaAppUrl);

    // Build endpoints list - try meta URL first, then fallbacks
    let endpoints = [];

    if (metaAppUrl && metaAppUrl.trim() !== "") {
      // Use the app URL from meta tag (works for both dev and prod)
      endpoints = [`${metaAppUrl}/api/public/popup-config?shop=${shopDomain}`];
    } else {
      // Fallback: try to detect current environment
      const currentOrigin = window.location.origin;
      const isLocalhost = window.location.hostname === "localhost";

      if (isLocalhost) {
        // Local development
        endpoints = [
          `http://localhost:38975/api/public/popup-config?shop=${shopDomain}`,
          `/api/public/popup-config?shop=${shopDomain}`,
        ];
      } else {
        // Try current origin (might be the tunnel URL)
        console.log(currentOrigin + "currentOrigin");
        endpoints = [
          `${applicationUrl}/api/public/popup-config?shop=${shopDomain}`,
          `/api/public/popup-config?shop=${shopDomain}`,
        ];
      }
    }

    console.log("Endpoints to try:", endpoints);


    // here we are trying every endpoints 
    for (const endpoint of endpoints) {
      try {
        console.log("Fetching popup config from:", endpoint);
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const json = await res.json();

          console.log("Popup config received:", json);
          console.log("Popup config received:", json.config);

          return json.config;
        } else {
          console.warn(
            "Failed to fetch from endpoint:",
            endpoint,
            "Status:",
            res.status,
          );
        }
      } catch (err) {
        console.warn("Fetch failed for endpoint:", endpoint, err);
      }
    }

    console.log(endpoint + "endpoint");

    // Fallback config
    return {
      type: "wheel",
      title: "Spin to Win!",
      description: "Try your luck and win a discount!",
      buttonText: "Spin Now!",
      segments: [
        { label: "5% OFF", color: "#ff6b6b", value: "5" },
        { label: "10% OFF", color: "#4ecdc4", value: "10" },
        { label: "15% OFF", color: "#45b7d1", value: "15" },
        { label: "20% OFF", color: "#feca57", value: "20" },
        { label: "FREE SHIPPING", color: "#ff9ff3", value: "shipping" },
        { label: "TRY AGAIN", color: "#54a0ff", value: null },
      ],
      backgroundColor: "#fff",
      textColor: "#000",
      buttonColor: "#007ace",
      placeholder: "Enter your email",
      discountCode: "SAVE10",
      borderRadius: 10,
      showCloseButton: true,
      displayDelay: 3000,
      frequency: "once",
      isActive: true,
      exitIntent: false,
    };
  };//fetchPopupConfig ends

  const shouldShowPopup = (config) => {
    const now = Date.now();
    const shownFlag = localStorage.getItem("popup-shown");
    const lastShown = parseInt(localStorage.getItem("popup-last-shown"), 10);
    const askLaterTime = parseInt(localStorage.getItem("popup-ask-later"), 10);

    // Check if "ask me later" is still active
    if (askLaterTime && now < askLaterTime) {
      return false;
    }

    // Check page targeting rules
    if (!shouldShowOnCurrentPage(config)) {
      return false;
    }

    switch (config.frequency) {
      case "once":
        return !shownFlag;
      case "daily":
        return !lastShown || now - lastShown > 86400000;
      case "weekly":
        return !lastShown || now - lastShown > 604800000;
      case "always":
        return true;
      default:
        return !shownFlag;
    }
  };//shouldShowPopup ends

  const shouldShowOnCurrentPage = (config) => {
    console.log("=== PAGE TARGETING DEBUG ===");
    console.log("Current URL:", window.location.href);
    console.log("Current pathname:", window.location.pathname);
    console.log("Config targetAllPages:", config.targetAllPages);
    console.log("Config targetSpecificPages:", config.targetSpecificPages);
    console.log("Config pageTargeting:", config.pageTargeting);

    // If targetAllPages is true, show on all pages
    if (config.targetAllPages === true) {
      console.log("Showing on all pages (targetAllPages = true)");
      return true;
    }

    // If targetSpecificPages is false, show on all pages (backward compatibility)
    if (config.targetSpecificPages === false) {
      console.log("Showing on all pages (targetSpecificPages = false)");
      return true;
    }

    // If no page targeting data, show on all pages (backward compatibility)
    if (!config.pageTargeting) {
      console.log("No page targeting data, showing on all pages");
      return true;
    }

    // Parse page targeting data
    let selectedPages;
    try {
      selectedPages =
        typeof config.pageTargeting === "string"
          ? JSON.parse(config.pageTargeting)
          : config.pageTargeting;
    } catch (e) {
      console.warn("Failed to parse page targeting data:", e);
      return true; // Show on all pages if parsing fails
    }

    console.log("Selected pages:", selectedPages);

    if (!selectedPages || selectedPages.length === 0) {
      console.log("No specific pages selected, showing on all pages");
      return true; // Show on all pages if no specific pages selected
    }

    // Get current page path
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const fullPath = currentPath + currentSearch;

    console.log("Checking page rules for:", { currentPath, fullPath });

    // Check if current page matches any of the selected pages
    for (const page of selectedPages) {
      console.log("Checking rule:", page);
      const matches = matchesPageRule(fullPath, currentPath, page);
      console.log("Rule matches:", matches);
      if (matches) {
        console.log("Page targeting matched! Showing popup.");
        return true;
      }
    }

    console.log("No page targeting rules matched. Not showing popup.");
    return false; // Don't show if no rules match
  };//shouldShowOnCurrentPage ends

  const matchesPageRule = (fullPath, currentPath, pageRule) => {
    // Handle different page types

    console.log('fullPath ' + fullPath + " , currentPath " + currentPath + " , pageRule " + pageRule );
    switch (pageRule.type) {
      case "home":
      case "homepage":
        return currentPath === "/" || currentPath === "";

      case "collection":
        return (
          currentPath === `/collections/${pageRule.handle}` ||
          currentPath.startsWith(`/collections/${pageRule.handle}?`)
        );

      case "collections":
        if (pageRule.handle === "all") {
          return currentPath.startsWith("/collections/");
        }
        return (
          currentPath === `/collections/${pageRule.handle}` ||
          currentPath.startsWith(`/collections/${pageRule.handle}?`)
        );

      case "product":
        return (
          currentPath === `/products/${pageRule.handle}` ||
          currentPath.startsWith(`/products/${pageRule.handle}?`)
        );

      case "products":
        if (pageRule.handle === "all") {
          return currentPath.startsWith("/products/");
        }
        return (
          currentPath === `/products/${pageRule.handle}` ||
          currentPath.startsWith(`/products/${pageRule.handle}?`)
        );

      case "page":
      case "pages":
        return (
          currentPath === `/pages/${pageRule.handle}` ||
          currentPath.startsWith(`/pages/${pageRule.handle}?`)
        );

      case "blog":
        if (pageRule.handle === "all") {
          return currentPath.startsWith("/blogs/");
        }
        return (
          currentPath === `/blogs/${pageRule.handle}` ||
          currentPath.startsWith(`/blogs/${pageRule.handle}`)
        );

      case "cart":
        return currentPath === "/cart" || currentPath.startsWith("/cart?");

      case "search":
        return currentPath === "/search" || currentPath.startsWith("/search?");

      case "account":
        return currentPath.startsWith("/account");

      case "custom":
        // For custom URLs, do exact match or pattern match
        if (pageRule.url) {
          // Support wildcards
          if (pageRule.url.includes("*")) {
            const pattern = pageRule.url.replace(/\*/g, ".*");
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(fullPath) || regex.test(currentPath);
          }
          // Exact match
          return fullPath === pageRule.url || currentPath === pageRule.url;
        }
        return false;

      default:
        // Fallback: try to match by value if type doesn't match
        if (pageRule.value) {
          if (pageRule.value === "/") {
            return currentPath === "/" || currentPath === "";
          }
          if (pageRule.value.includes("*")) {
            const pattern = pageRule.value.replace(/\*/g, ".*");
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(fullPath) || regex.test(currentPath);
          }
          return fullPath === pageRule.value || currentPath === pageRule.value;
        }
        return false;
    }
  };//matchesPageRule ends

  const showPopup = (config) => {

    console.log("Config of showPopup method " + config);


    // For "always" frequency, ignore popupShown flag
    if (config.frequency !== "always" && popupShown) return;
    if (!shouldShowPopup(config)) return;

    const overlay = document.getElementById("custom-popup-overlay");
    const popup = document.getElementById("custom-popup");
    const wheelContainer = popup.querySelector(".popup-wheel-container");
    const form = popup.querySelector(".popup-form");
    const closeBtn = popup.querySelector(".popup-close");

    overlay.style.display = "flex";
    closeBtn.style.display = config.showCloseButton === false ? "none" : "flex";

    // Track popup view
    trackEvent("view", {
      metadata: {
        popupType: config.type,
        displayDelay: config.displayDelay,
        frequency: config.frequency,
        exitIntent: config.exitIntent,
      },
    });
    

    // emailPopup starts from here
    
    if (config.type === "email") {
      // Show traditional email popup layout
      popup.classList.add("email-popup");
      popup.style.background = config.backgroundColor || "#ffffff";
      popup.style.color = config.textColor || "#000000";
      popup.style.borderRadius = `${config.borderRadius || 8}px`;

      // Hide wheel section for email popup
      const wheelSection = popup.querySelector(".wheel-section");
      const formSection = popup.querySelector(".form-section");
      const communityContent = popup.querySelector(".community-content");
      const popupContent = popup.querySelector(".popup-content");

      wheelSection.style.display = "none";
      communityContent.style.display = "none";
      formSection.style.display = "block";
      formSection.style.color = config.textColor || "#000000";

      // Ensure popup content doesn't use flex layout for email popup
      popupContent.style.display = "block";

      // Update form section content for email popup
      formSection.innerHTML = `
        <button class="popup-close" onclick="closePopup()" style="color: ${config.textColor || "#000000"};">&times;</button>
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 10px; color: ${config.textColor || "#000000"};">📧</div>
          <h3 style="font-size: 20px; font-weight: 600; margin: 0 0 15px 0; color: ${config.textColor || "#000000"};">
            ${config.title}
          </h3>
          <p style="margin-bottom: 20px; line-height: 1.5; color: ${config.textColor || "#000000"};">
            ${config.description}
          </p>
          <input type="email" id="popup-email" placeholder="${config.placeholder}" style="
            width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px;
            margin-bottom: 15px; font-size: 14px; box-sizing: border-box;
          " />
          <button onclick="handleEmailSubmit()" style="
            width: 100%; padding: 12px 24px; border: none; border-radius: 6px;
            font-weight: 600; cursor: pointer; font-size: 14px;
            background-color: ${config.buttonColor || "#007ace"}; color: white;
          ">
            ${config.buttonText}
          </button>
        </div>
      `;

      // email popup ends here


      // community popup starts from here

    } else if (config.type === "community") {
      // Show community popup layout
      popup.classList.add("community-popup");
      popup.style.background = config.backgroundColor || "#ffffff";
      popup.style.color = config.textColor || "#000000";
      popup.style.borderRadius = `${config.borderRadius || 12}px`;
      popup.style.maxWidth = "400px";
      popup.style.display = "block";

      // Hide other sections for community popup
      const wheelSection = popup.querySelector(".wheel-section");
      const formSection = popup.querySelector(".form-section");
      const communityContent = popup.querySelector(".community-content");
      const popupContent = popup.querySelector(".popup-content");

      wheelSection.style.display = "none";
      formSection.style.display = "none";
      communityContent.style.display = "block";

      // Ensure popup content doesn't use flex layout for community popup
      popupContent.style.display = "block";

      // Parse social icons - handle both string and array formats
      let socialIcons;
      try {
        socialIcons =
          typeof config.socialIcons === "string"
            ? JSON.parse(config.socialIcons)
            : config.socialIcons;
      } catch (e) {
        socialIcons = [
          { platform: "facebook", url: "", enabled: true },
          { platform: "instagram", url: "", enabled: true },
          { platform: "linkedin", url: "", enabled: true },
          { platform: "x", url: "", enabled: true },
        ];
      }

      if (!socialIcons || !Array.isArray(socialIcons)) {
        socialIcons = [
          { platform: "facebook", url: "", enabled: true },
          { platform: "instagram", url: "", enabled: true },
          { platform: "linkedin", url: "", enabled: true },
          { platform: "x", url: "", enabled: true },
        ];
      }

      // Create social icons HTML - show all enabled icons
      const enabledSocialIcons = socialIcons.filter((icon) => icon.enabled);
      const socialIconsHTML = enabledSocialIcons
        .map((social) => {
          const iconColor =
            social.platform === "facebook"
              ? "#1877f2"
              : social.platform === "instagram"
                ? "#E4405F"
                : social.platform === "linkedin"
                  ? "#0077b5"
                  : social.platform === "x"
                    ? "#1DA1F2"
                    : "#666";

          // Use the provided social media icon images from assets
          const getIconHTML = (platform) => {
            // Use the asset URLs passed from Liquid template
            const iconUrls = window.socialIconAssets || {};
            const iconKey = platform === "x" ? "twitter" : platform;
            const iconUrl = iconUrls[iconKey];

            if (iconUrl) {
              return `<img src="${iconUrl}" alt="${platform}" style="width: 40px; height: 40px; object-fit: contain; object-position: center; display: block;" onerror="this.style.display='none'" />`;
            } else {
              // Fallback to text if image not available
              const fallbackText =
                platform === "facebook"
                  ? "f"
                  : platform === "instagram"
                    ? "ig"
                    : platform === "linkedin"
                      ? "in"
                      : platform === "x"
                        ? "X"
                        : "?";
              return `<span style="font-weight: bold; font-size: 18px;">${fallbackText}</span>`;
            }
          };

          const clickAction =
            social.url && social.url.trim() !== ""
              ? `window.open('${social.url}', '_blank')`
              : `alert('Please configure the ${social.platform} URL in admin panel')`;

          return `
          <div class="social-icon" onclick="${clickAction}" style="
            display: inline-block;
            width: 40px;
            height: 40px;
            margin: 0 8px;
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ${getIconHTML(social.platform)}
          </div>
        `;
        })
        .join("");

      // Update community content with banner at top
      communityContent.innerHTML = `
        ${(() => {
          // Always show banner - use custom banner image if provided, otherwise use default banner.svg
          const bannerUrl =
            config.bannerImage && config.bannerImage.trim() !== ""
              ? config.bannerImage
              : window.defaultBannerAsset;

          console.log("Banner URL:", bannerUrl); // Debug log

          return `
            <div class="community-banner" style="
              width: 100%;
              height: 150px;
              background-image: url('${bannerUrl}');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              margin: 0;
              padding: 0;
              border-radius: 12px 12px 0 0;
              display: block;
              position: relative;
            "></div>
          `;
        })()}
        <div class="community-content-inner" style="padding: 20px; text-align: center; position: relative;">
          <button class="popup-close" onclick="closePopup()" style="
            position: absolute;
            top: -135px;
            right: 15px;
            background: rgba(0,0,0,0.3);
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            color: white;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          ">&times;</button>
          <h3 style="
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 15px 0;
            color: ${config.textColor || "#000000"};
            text-align: center;
          ">
            ${config.title || "JOIN OUR COMMUNITY"}
          </h3>
          <p style="
            margin-bottom: 25px;
            line-height: 1.5;
            color: ${config.textColor || "#000000"};
            text-align: center;
            font-size: 16px;
          ">
            ${config.description || "Connect with us on social media and stay updated with our latest news and offers!"}
          </p>
          <div style="
            margin-bottom: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          ">
            ${socialIconsHTML}
          </div>
          ${
            config.showAskMeLater !== false
              ? `
            <div style="margin-top: 20px;">
              <a href="#" onclick="askMeLater(); return false;" style="
                color: ${config.textColor || "#000000"};
                text-decoration: underline;
                font-size: 14px;
                opacity: 0.7;
                transition: opacity 0.2s ease;
              " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                ${config.askMeLaterText || "Ask me later"}
              </a>
            </div>
          `
              : ""
          }
        </div>
      `;
        // Community popup ends here


    } else if (config.type === "timer") {
      // Show timer popup layout
      popup.classList.add("timer-popup");
      popup.style.background =
        config.backgroundColor ||
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      popup.style.color = config.textColor || "#ffffff";
      popup.style.borderRadius = `${config.borderRadius || 16}px`;
      popup.style.maxWidth = "500px";
      popup.style.display = "block";

      // Hide other sections for timer popup
      const wheelSection = popup.querySelector(".wheel-section");
      const formSection = popup.querySelector(".form-section");
      const communityContent = popup.querySelector(".community-content");
      const timerContent = popup.querySelector(".timer-content");
      const popupContent = popup.querySelector(".popup-content");

      wheelSection.style.display = "none";
      formSection.style.display = "none";
      communityContent.style.display = "none";
      timerContent.style.display = "block";

      // Ensure popup content doesn't use flex layout for timer popup
      popupContent.style.display = "block";

      // Initialize timer popup
      initializeTimerPopup(config, timerContent);
    } else if (config.type === "scratch-card") {
      // Show scratch card popup layout
      popup.classList.add("scratch-card-popup");
      popup.style.background = config.backgroundColor || "#ffffff";
      popup.style.color = config.textColor || "#000000";
      popup.style.borderRadius = `${config.borderRadius || 16}px`;

      // Make responsive based on screen size
      if (window.innerWidth <= 480) {
        popup.style.maxWidth = "98vw";
        popup.style.margin = "8px";
      } else if (window.innerWidth <= 768) {
        popup.style.maxWidth = "95vw";
        popup.style.margin = "15px";
      } else {
        popup.style.maxWidth = "600px";
      }

      popup.style.display = "block";

      // Hide other sections for scratch card popup
      const wheelSection = popup.querySelector(".wheel-section");
      const formSection = popup.querySelector(".form-section");
      const communityContent = popup.querySelector(".community-content");
      const timerContent = popup.querySelector(".timer-content");
      const scratchCardContent = popup.querySelector(".scratch-card-content");
      const popupContent = popup.querySelector(".popup-content");

      wheelSection.style.display = "none";
      formSection.style.display = "none";
      communityContent.style.display = "none";
      timerContent.style.display = "none";
      scratchCardContent.style.display = "block";

      // Ensure popup content doesn't use flex layout for scratch card popup
      popupContent.style.display = "block";

      // Initialize scratch card popup
      initializeScratchCardPopup(config, scratchCardContent);

      // scratch popup ends here 

      // WHEEL POPUP Starts from here
    } else {
      // Show wheel-email combo layout
      popup.classList.remove("email-popup");
      popup.style.background =
        // config.backgroundColor ||
        "linear-gradient(135deg, #09090aff 0%, #2a5298 100%)";

      // Make responsive based on screen size
      if (window.innerWidth <= 480) {
        popup.style.maxWidth = "98vw";
        popup.style.margin = "8px";
      } else if (window.innerWidth <= 768) {
        popup.style.maxWidth = "95vw";
        popup.style.margin = "15px";
      } else {
        popup.style.maxWidth = "600px";
      }

      popup.style.display = "flex";

      // Show wheel section for wheel-email popup
      const wheelSection = popup.querySelector(".wheel-section");
      const formSection = popup.querySelector(".form-section");
      const popupContent = popup.querySelector(".popup-content");

      wheelSection.style.display = "flex";
      formSection.style.flex = "1";
      formSection.style.width = "auto";
      formSection.style.padding = "40px 30px";
      formSection.style.color = config.textColor || "white";

      // Ensure popup content uses flex layout for wheel-email popup
      popupContent.style.display = "flex";

      // Reset form section content for wheel-email popup
      formSection.innerHTML = `
        <button class="popup-close" onclick="closePopup()">&times;</button>
        <div class="form-title">${config.title || "GET YOUR CHANCE TO WIN"}</div>
        <div class="form-subtitle">${config.subtitle || "AMAZING DISCOUNTS!"}</div>
        <p class="form-description">${config.description || "Enter your email below and spin the wheel to see if you are our next lucky winner!"}</p>
        <div class="popup-form">
          <!-- Form content will be dynamically inserted here -->
        </div>
        <div class="house-rules">
          <h4>The House rules:</h4>
          <ul>
            <li>Winnings through cheating will not be processed.</li>
            <li>Only one spin allowed</li>
          </ul>
        </div>
      `;

      // Use vibrant, eye-catching colors for segments
      const segments = /*config.segments || */[
        { label: "5% OFF", color: "#0a2a43", value: "5" },      // Dark navy
  { label: "10% OFF", color: "#133b5c", value: "10" },    // Deep steel blue
  { label: "15% OFF", color: "#0a2a43", value: "15" },
  { label: "20% OFF", color: "#133b5c", value: "20" },
  { label: "FREE SHIPPING", color: "#0a2a43", value: "shipping" },
  { label: "TRY AGAIN", color: "#133b5c", value: null },
      ];

      const angle = 360 / segments.length;
      // Create premium gradient with subtle transitions
      const gradient = segments
        .map((s, i) => {
          const startAngle = i * angle;
          const endAngle = (i + 1) * angle;
          const midAngle = startAngle + angle * 0.5;

          // Add subtle gradient within each segment for depth
          return `${s.color} ${startAngle}deg, ${s.color}dd ${midAngle}deg, ${s.color} ${endAngle}deg`;
        })
        .join(", ");

      // Create segment labels with horizontal text positioned within wheel
      const segmentLabels = segments
  .map((segment, index) => {
    const segmentAngle = (360 / segments.length) * index + 360 / segments.length / 2;

    let radius = window.innerWidth <= 480 ? 55 : window.innerWidth <= 768 ? 70 : 90;
    let fontSize = window.innerWidth <= 480 ? "10px" : window.innerWidth <= 768 ? "12px" : "14px";

    const x = Math.cos(((segmentAngle - 90) * Math.PI) / 180) * radius;
    const y = Math.sin(((segmentAngle - 90) * Math.PI) / 180) * radius;

    return `
      <div class="wheel-segment-label" style="
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${segmentAngle}deg);
        font-size: ${fontSize};
        font-weight: bold;
        text-transform: uppercase;
        color: white;
        letter-spacing: 0.5px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
        max-width: 60px;
        text-align: center;
        pointer-events: none;
      ">
        ${segment.label}
      </div>
    `;
  })
  .join("");
      // Create the wheel with premium styling
      wheelContainer.innerHTML = `
        <div class="spinning-wheel" id="spinning-wheel" style="
          background: conic-gradient(${gradient});
          position: relative;
          background-size: 100% 100%;
          background-repeat: no-repeat;
        ">
          <div class="wheel-pointer"></div>
          <div class="wheel-center">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 8px;
              height: 8px;
              background: #08162aff;
              border-radius: 50%;
              box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
            "></div>
          </div>
          ${segmentLabels}
        </div>
      `;

      // Create the form
      const formElement = formSection.querySelector(".popup-form");
    formElement.innerHTML = `
 <input type="email" class="email-input" id="popup-email" placeholder="Enter your email" />
  <button class="spin-button" onclick="handleEmailAndSpin()" style="
    background: linear-gradient(45deg, #0a2a43, #133b5c);
    color: white;
    padding: 14px 28px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  ">
    ${config.buttonText || "TRY YOUR LUCK"}
  </button>
`;
    }

    // Set localStorage - but not for "always" frequency
    if (config.frequency !== "always") {
      popupShown = true;
    }

    const now = Date.now().toString();
    if (config.frequency === "once") {
      localStorage.setItem("popup-shown", "true");
    } else if (config.frequency !== "always") {
      localStorage.setItem("popup-last-shown", now);
    }
    // For "always" frequency, don't set any localStorage flags
  };// show popup ends

  // Make closePopup globally accessible
  window.closePopup = () => {
    document.getElementById("custom-popup-overlay").style.display = "none";
    // Track popup close
    trackEvent("close");
  };

  // Ask me later function for community popup
  window.askMeLater = () => {
    // Set a temporary flag to not show popup for a short period (e.g., 1 hour)
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    localStorage.setItem("popup-ask-later", (Date.now() + oneHour).toString());

    // Track ask me later event
    trackEvent("ask_me_later");

    // Close the popup
    window.closePopup();
  };

  // Generate real Shopify discount code
  async function generateShopifyDiscount(
    email,
    discountValue,
    discountType = "percentage",
  ) {
    try {
      console.log(
        "Generating discount code for:",
        email,
        discountValue,
        discountType,
      );

      const shopDomain = getShopDomain();
      const metaAppUrl = document.querySelector(
        'meta[name="shopify-app-url"]',
      )?.content;

      // Build endpoint URL
      let endpoint;
      if (metaAppUrl && metaAppUrl.trim() !== "") {
        endpoint = `${metaAppUrl}/api/public/generate-discount`;
      } else {
        // Fallback endpoints
        const isLocalhost = window.location.hostname === "localhost";
        if (isLocalhost) {
          endpoint = `${applicationUrl}/api/public/generate-discount`;
        } else {
          endpoint = `${applicationUrl}/api/public/generate-discount`;
        }
      }

      console.log("Using endpoint:", endpoint);

      const formData = new FormData();
      formData.append("email", email);
      formData.append("discountValue", discountValue);
      formData.append("discountType", discountType);
      formData.append("shop", shopDomain);

      console.log("Sending request to generate discount...");

      const response = await fetch(
        `${endpoint}?shop=${encodeURIComponent(shopDomain)}`,
        {
          method: "POST",
          body: formData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(
          `Failed to generate discount code: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to generate discount code");
      }

      console.log("Generated discount code:", data.discountCode);
      console.log("Shopify created:", data.shopifyCreated);

      // Return the full response data for better handling
      return {
        code: data.discountCode,
        shopifyCreated: data.shopifyCreated,
        instructions: data.instructions,
        note: data.note,
      };
    } catch (error) {
      console.error("Error in generateShopifyDiscount:", error);
      throw error;
    }
  }//generateShopifyDiscount ends

  // New combined email and spin handler
  async function handleEmailAndSpin() {
    const email = document.getElementById("popup-email")?.value;
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    // Track email entered
    trackEvent("email_entered", { email: email });

    // Get segments
    const segments = popupConfig.segments || [
      { label: "5% OFF", color: "#ff6b6b", code: "SAVE5" },
      { label: "10% OFF", color: "#4ecdc4", code: "SAVE10" },
      { label: "15% OFF", color: "#45b7d1", code: "SAVE15" },
      { label: "20% OFF", color: "#feca57", code: "SAVE20" },
      { label: "FREE SHIPPING", color: "#ff9ff3", code: "FREESHIP" },
      { label: "TRY AGAIN", color: "#54a0ff", code: null },
    ];

    // Randomly select a prize FIRST
    const prizeIndex = Math.floor(Math.random() * segments.length);
    const prize = segments[prizeIndex];

    // Track spin event
    trackEvent("spin", {
      email: email,
      prizeLabel: prize.label,
      metadata: { prizeIndex: prizeIndex, totalSegments: segments.length },
    });

    // Calculate the angle where the wheel should stop to land on the selected prize
    const segmentAngle = 360 / segments.length;
    const targetAngle = prizeIndex * segmentAngle + segmentAngle / 2;

    // Add multiple full rotations for visual effect (3-5 full spins)
    const fullRotations = 3 + Math.random() * 2; // 3-5 rotations
    const finalRotation = fullRotations * 360 + (360 - targetAngle); // Subtract because wheel spins clockwise but pointer is on right

    // Start spinning the wheel
    const wheel = document.getElementById("spinning-wheel");
    const button = document.querySelector(".spin-button");

    // Disable button during spin
    button.disabled = true;
    button.textContent = "SPINNING...";

    // Apply the calculated rotation with realistic physics animation
    wheel.style.transition = "transform 4s cubic-bezier(0.23, 1, 0.32, 1)";
    wheel.style.transform = `rotate(${finalRotation}deg)`;

    // Add subtle vibration effect during spin
    wheel.style.filter = "blur(0.5px)";

    setTimeout(async () => {
      // Add subtle bounce effect when stopping
      wheel.style.transition =
        "transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
      wheel.style.transform = `rotate(${finalRotation + 5}deg)`;
      wheel.style.filter = "blur(0px)";

      setTimeout(() => {
        wheel.style.transition = "transform 0.2s ease-out";
        wheel.style.transform = `rotate(${finalRotation}deg)`;
      }, 300);

      console.log(`Wheel landed on: ${prize.label} (index: ${prizeIndex})`);

      // Check if it's a winning segment (has a discount code)
      const isWinner = prize.code && prize.code !== null;

      if (isWinner) {
        // Use the pre-configured discount code from the segment
        const discountCode = prize.code;

        // Track win event
        trackEvent("win", {
          email: email,
          discountCode: discountCode,
          prizeLabel: prize.label,
          metadata: {
            preconfigured: true,
            segmentIndex: prizeIndex,
          },
        });

        showWinnerDisplay(prize.label, discountCode);
      } else {
        // Track lose event
        trackEvent("lose", {
          email: email,
          prizeLabel: prize.label,
        });
        showTryAgainDisplay(prize.label);
      }
    }, 4000); // 4 second spin for more realistic feel
  }//handleEmailAndSpin ends

  // Make handleEmailAndSpin globally accessible
  window.handleEmailAndSpin = handleEmailAndSpin;

  // Email handler for email popup type
  async function handleEmailSubmit() {
    const email = document.getElementById("popup-email")?.value;
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    // Track email entered for email popup
    trackEvent("email_entered", { email: email });

    // Use the pre-configured discount code from admin settings
    const discountCode = popupConfig.discountCode || "WELCOME10";

    // Track win event for email popup
    trackEvent("win", {
      email: email,
      discountCode: discountCode,
      prizeLabel: "Email Discount",
      metadata: {
        popupType: "email",
        preconfigured: true,
      },
    });

    // Show the pre-configured discount code with personalized message
    const formSection = document.querySelector(".form-section");

    // Create personalized success messages
    let thankYouMessage = "Thank You!";
    let successMessage = "Here's your exclusive discount code:";

    // Customize based on popup title or discount type
    if (
      popupConfig.title &&
      popupConfig.title.toLowerCase().includes("newsletter")
    ) {
      thankYouMessage = "Welcome to our Newsletter!";
      successMessage = "Here's your subscriber discount:";
    } else if (
      popupConfig.title &&
      popupConfig.title.toLowerCase().includes("first order")
    ) {
      thankYouMessage = "Welcome New Customer!";
      successMessage = "Here's your first order discount:";
    } else if (discountCode.toLowerCase().includes("welcome")) {
      thankYouMessage = "Welcome!";
      successMessage = "Here's your welcome discount:";
    } else if (discountCode.toLowerCase().includes("save")) {
      thankYouMessage = "You're Saving Money!";
      successMessage = "Here's your savings code:";
    }

    formSection.innerHTML = `
      <button class="popup-close" onclick="closePopup()" style="color: ${popupConfig.textColor || "#000000"};">&times;</button>
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 15px;">🎉</div>
        <h3 style="font-size: 20px; font-weight: 600; margin: 0 0 15px 0; color: ${popupConfig.textColor || "#000000"};">
          ${thankYouMessage}
        </h3>
        <p style="margin-bottom: 20px; color: ${popupConfig.textColor || "#000000"};">
          ${successMessage}
        </p>
        <div onclick="copyDiscountCode()" style="
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px dashed #28a745;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <div id="discount-code" style="
            font-size: 28px;
            font-weight: bold;
            color: #28a745;
            margin-bottom: 8px;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
          ">
            ${discountCode}
          </div>
          <div style="font-size: 14px; color: #6c757d; font-style: italic;">
            Click to copy to clipboard
          </div>
        </div>
        <button id="copy-btn" onclick="copyDiscountCode()" style="
          width: 100%;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 10px;
          font-size: 14px;
        ">
          📋 Copy Code
        </button>
        <button onclick="window.closePopup()" style="
          width: 100%;
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          margin-top: 10px;
        ">
          Close
        </button>
      </div>
    `;
  }//handleEmailSubmit ends 

  // Make handleEmailSubmit globally accessible
  window.handleEmailSubmit = handleEmailSubmit;

  // Show winner display
  function showWinnerDisplay(prizeLabel, discountCode) {
    const formSection = document.querySelector(".form-section");

    // Create consistent winning messages that match the wheel segment exactly
    let congratsMessage = "🎉 CONGRATULATIONS!";
    let winMessage = `YOU WON ${prizeLabel}!`;
    let enjoyMessage = "Enjoy your discount!";
    let codeMessage = "Use this discount code:";

    // Customize messages based on the exact prize label from the wheel
    if (prizeLabel.toLowerCase().includes("free shipping")) {
      enjoyMessage = "Enjoy free shipping on your order!";
      codeMessage = "Use this code at checkout:";
    } else if (
      prizeLabel.toLowerCase().includes("discount") ||
      prizeLabel.toLowerCase().includes("%")
    ) {
      // Extract the discount amount from the label for consistent messaging
      const discountMatch = prizeLabel.match(/(\d+%|\d+\s*%)/i);
      if (discountMatch) {
        enjoyMessage = `Enjoy ${discountMatch[0]} off your purchase!`;
      } else {
        enjoyMessage = `Enjoy your ${prizeLabel.toLowerCase()}!`;
      }
      codeMessage = "Use this discount code:";
    }

    formSection.innerHTML = `
      <button class="popup-close" onclick="closePopup()">&times;</button>
      <div class="form-title">${congratsMessage}</div>
      <div class="form-subtitle">${winMessage}</div>
      <div style="margin-top: 20px;">
        <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 15px; text-align: center;">
          ${enjoyMessage}
        </div>
        <div style="color: white; font-size: 14px; margin-bottom: 15px; text-align: center;">
          ${codeMessage}
        </div>
        <div class="discount-code-container" onclick="copyDiscountCode()" style="background: white; border: 2px dashed #28a745; border-radius: 12px; padding: 20px; margin-bottom: 15px; cursor: pointer; transition: all 0.3s ease;">
          <div class="discount-code-text" id="discount-code" style="font-size: 28px; font-weight: bold; color: #28a745; margin-bottom: 8px; letter-spacing: 2px; font-family: 'Courier New', monospace; text-align: center;">
            ${discountCode}
          </div>
          <div style="font-size: 14px; color: #6c757d; font-style: italic; text-align: center;">
            Click to copy to clipboard
          </div>
        </div>
        <button class="copy-button" id="copy-btn" onclick="copyDiscountCode()" style="width: 100%; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border: none; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 10px; font-size: 14px;">
          📋 Copy Code
        </button>
        <button class="close-button" onclick="window.closePopup()" style="width: 100%; background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); border: none; color: white; padding: 10px 20px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px;">
          Close
        </button>
      </div>
    `;
  }//showWinnerDisplay ends

  // Show try again display
  function showTryAgainDisplay(prizeLabel) {
    const formSection = document.querySelector(".form-section");

    // Create personalized losing messages based on the prize label
    let titleMessage = `😔 ${prizeLabel}`;
    let subtitleMessage = "Better luck next time!";
    let encouragementMessage =
      "Don't worry! Keep shopping and you might get another chance to win amazing discounts.";
    let buttonText = "Continue Shopping";

    // Customize messages based on prize label
    if (prizeLabel.toLowerCase().includes("try again")) {
      titleMessage = "🎯 TRY AGAIN";
      subtitleMessage = "So close!";
      encouragementMessage =
        "You were so close to winning! Keep browsing our amazing products and try again soon.";
    } else if (prizeLabel.toLowerCase().includes("next time")) {
      titleMessage = "⏰ NEXT TIME";
      subtitleMessage = "Your luck is coming!";
      encouragementMessage =
        "Great things come to those who wait. Continue shopping and your discount is waiting!";
    } else if (prizeLabel.toLowerCase().includes("unlucky")) {
      titleMessage = "🍀 UNLUCKY";
      subtitleMessage = "But not for long!";
      encouragementMessage =
        "Sometimes luck takes a moment to find you. Keep exploring our products!";
    } else if (prizeLabel.toLowerCase().includes("no prize")) {
      titleMessage = "🎁 NO PRIZE";
      subtitleMessage = "This time!";
      encouragementMessage =
        "No prize this round, but our amazing products are always a win. Keep shopping!";
    }

    formSection.innerHTML = `
      <button class="popup-close" onclick="closePopup()">&times;</button>
      <div class="form-title">${titleMessage}</div>
      <div class="form-subtitle">${subtitleMessage}</div>
      <div style="text-align: center; padding: 20px;">
        <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 20px;">
          ${encouragementMessage}
        </p>
        <button class="close-button" onclick="window.closePopup()">
          ${buttonText}
        </button>
      </div>
    `;
  }//showTryAgainDisplay ends 

  // Show discount code with copy functionality (legacy)
  function showDiscountCode() {
    const form = document.querySelector(".popup-form");
    const discountCode = popupConfig.discountCode || "SAVE10";

    form.innerHTML = `
      <div class="discount-display">
        <div class="discount-success">
          🎉 Thank you! Here's your discount:
        </div>
        <div class="discount-code-container" onclick="copyDiscountCode()">
          <div class="discount-code-text" id="discount-code">
            ${discountCode}
          </div>
          <div class="discount-code-hint">
            Click to copy to clipboard
          </div>
        </div>
        <button class="copy-button" id="copy-btn" onclick="copyDiscountCode()">
          📋 Copy Code
        </button>
        <br>
        <button class="close-button" onclick="window.closePopup()">
          Close
        </button>
      </div>
    `;
  }//showDiscountCode ends

  // Make showDiscountCode globally accessible
  window.showDiscountCode = showDiscountCode;

  // Copy discount code to clipboard
  function copyDiscountCode() {
    // Get the discount code from the displayed element
    const discountCodeElement = document.getElementById("discount-code");
    const discountCode = discountCodeElement
      ? discountCodeElement.textContent.trim()
      : popupConfig.discountCode || "SAVE10";

    // Track copy event
    trackEvent("copy_code", {
      discountCode: discountCode,
    });

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(discountCode)
        .then(() => {
          showCopySuccess();
        })
        .catch(() => {
          fallbackCopyTextToClipboard(discountCode);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyTextToClipboard(discountCode);
    }
  }//copyDiscountCode ends

  // Make copyDiscountCode globally accessible
  window.copyDiscountCode = copyDiscountCode;

  // Fallback copy method
  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      showCopySuccess();
    } catch (err) {
      alert(`Copy failed. Your discount code is: ${text}`);
    }

    document.body.removeChild(textArea);
  }//fallbackCopyTextToClipboard

  // Show copy success message
  function showCopySuccess() {
    const button = document.getElementById("copy-btn");
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = "✅ Copied!";
      button.classList.add("copied");

      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove("copied");
      }, 2000);
    }

    // Also show a brief notification
    showNotification("Discount code copied to clipboard!");
  }//showCopySuccess ends

  // Show notification message
  function showNotification(message) {
    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation keyframes if not already added
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }//showNotfication ends

  // Timer popup functionality
  let timerInterval = null;
  let timerEndTime = null;

  function initializeTimerPopup(config, timerContent) {
    // Calculate timer end time
    const timerDuration = {
      days: parseInt(config.timerDays) || 0,
      hours: parseInt(config.timerHours) || 0,
      minutes: parseInt(config.timerMinutes) || 5,
      seconds: parseInt(config.timerSeconds) || 0,
    };

    const totalMs =
      timerDuration.days * 24 * 60 * 60 * 1000 +
      timerDuration.hours * 60 * 60 * 1000 +
      timerDuration.minutes * 60 * 1000 +
      timerDuration.seconds * 1000;

    // Check for existing timer
    const storageKey = `timer-popup-end-time-${getShopDomain()}`;
    const storedEndTime = localStorage.getItem(storageKey);

    if (storedEndTime && parseInt(storedEndTime) > Date.now()) {
      // Use existing timer
      timerEndTime = parseInt(storedEndTime);
    } else {
      // Create new timer
      timerEndTime = Date.now() + totalMs;
      localStorage.setItem(storageKey, timerEndTime.toString());
    }

    // Create timer popup HTML
    const timerPopupInner = timerContent.querySelector(".timer-popup-inner");
    timerPopupInner.innerHTML = `
      <button class="popup-close" onclick="closePopup()" style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        color: white;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 10;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">&times;</button>
      
      <div class="timer-popup-header">
        <div class="timer-popup-icon">${config.timerIcon || "⏰"}</div>
        <h2 class="timer-popup-title">${config.title || "LIMITED TIME OFFER!"}</h2>
        <p class="timer-popup-subtitle">${config.description || "Don't miss out on this exclusive deal. Time is running out!"}</p>
      </div>
      
      <div class="timer-display" id="timer-display">
        <div class="timer-unit" id="days-unit" style="display: ${timerDuration.days > 0 ? "block" : "none"}">
          <div class="timer-number" id="days">00</div>
          <div class="timer-label">Days</div>
        </div>
        <div class="timer-unit" id="hours-unit">
          <div class="timer-number" id="hours">00</div>
          <div class="timer-label">Hours</div>
        </div>
        <div class="timer-unit" id="minutes-unit">
          <div class="timer-number" id="minutes">00</div>
          <div class="timer-label">Minutes</div>
        </div>
        <div class="timer-unit" id="seconds-unit">
          <div class="timer-number" id="seconds">00</div>
          <div class="timer-label">Seconds</div>
        </div>
      </div>
      
      <div class="timer-form">
        <input type="email" class="timer-email-input" id="timer-email" placeholder="${config.placeholder || "Enter your email to claim this offer"}" />
        <button class="timer-cta-button" onclick="handleTimerSubmit()">
          ${config.buttonText || "CLAIM OFFER NOW"}
        </button>
      </div>
      
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-top: 15px;">
        ${config.disclaimer || "Limited time offer. Valid while supplies last."}
      </div>
    `;

    // Start the timer
    startTimer();
  }//initializeTimerPopup ends

  function startTimer() {
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
      const now = Date.now();
      const timeLeft = timerEndTime - now;

      if (timeLeft <= 0) {
        // Timer expired
        handleTimerExpired();
        return;
      }

      // Calculate time units
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      // Update display
      updateTimerDisplay(days, hours, minutes, seconds);

      // Add urgency effects when time is low
      if (timeLeft < 60000) {
        // Less than 1 minute
        const timerDisplay = document.getElementById("timer-display");
        if (timerDisplay) {
          timerDisplay.classList.add("timer-urgent");
        }
      }
    }, 1000);

    // Initial update
    const now = Date.now();
    const timeLeft = timerEndTime - now;
    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      updateTimerDisplay(days, hours, minutes, seconds);
    }
  }//startTimer ends

  function updateTimerDisplay(days, hours, minutes, seconds) {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    if (daysEl) {
      const newDays = days.toString().padStart(2, "0");
      if (daysEl.textContent !== newDays) {
        daysEl.textContent = newDays;
        const daysUnit = document.getElementById("days-unit");
        if (daysUnit) {
          daysUnit.classList.add("flash");
          setTimeout(() => daysUnit.classList.remove("flash"), 500);
        }
      }
    }

    if (hoursEl) {
      const newHours = hours.toString().padStart(2, "0");
      if (hoursEl.textContent !== newHours) {
        hoursEl.textContent = newHours;
        const hoursUnit = document.getElementById("hours-unit");
        if (hoursUnit) {
          hoursUnit.classList.add("flash");
          setTimeout(() => hoursUnit.classList.remove("flash"), 500);
        }
      }
    }

    if (minutesEl) {
      const newMinutes = minutes.toString().padStart(2, "0");
      if (minutesEl.textContent !== newMinutes) {
        minutesEl.textContent = newMinutes;
        const minutesUnit = document.getElementById("minutes-unit");
        if (minutesUnit) {
          minutesUnit.classList.add("flash");
          setTimeout(() => minutesUnit.classList.remove("flash"), 500);
        }
      }
    }

    if (secondsEl) {
      const newSeconds = seconds.toString().padStart(2, "0");
      if (secondsEl.textContent !== newSeconds) {
        secondsEl.textContent = newSeconds;
        const secondsUnit = document.getElementById("seconds-unit");
        if (secondsUnit) {
          secondsUnit.classList.add("flash");
          setTimeout(() => secondsUnit.classList.remove("flash"), 500);
        }
      }
    }
  }//updateTimerDisplay

  function handleTimerExpired() {
    clearInterval(timerInterval);

    const config = popupConfig;
    const timerContent = document.querySelector(
      ".timer-content .timer-popup-inner",
    );

    // Track timer expiration
    trackEvent("timer_expired", {
      metadata: {
        popupType: "timer",
        expiredAt: new Date().toISOString(),
      },
    });

    if (config.onExpiration === "hide" || config.onExpiration === "disappear") {
      // Hide the popup
      window.closePopup();
    } else {
      // Show expired message (default behavior)
      timerContent.innerHTML = `
        <button class="popup-close" onclick="closePopup()" style="
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          cursor: pointer;
          color: white;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 10;
        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">&times;</button>
        
        <div class="timer-expired">
          <div class="timer-expired-icon">${config.expiredIcon || "⏰"}</div>
          <h2 class="timer-expired-title">${config.expiredTitle || "OFFER EXPIRED"}</h2>
          <p class="timer-expired-message">${config.expiredMessage || "Sorry, this limited time offer has ended. But don't worry, we have other great deals waiting for you!"}</p>
          <button class="timer-cta-button" onclick="window.closePopup()" style="max-width: 200px;">
            ${config.expiredButtonText || "CONTINUE SHOPPING"}
          </button>
        </div>
      `;
    }
  }//handleTimeExpired ends

  // Timer form submission handler
  async function handleTimerSubmit() {
    const email = document.getElementById("timer-email")?.value;
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    // Track email entered for timer popup
    trackEvent("email_entered", {
      email: email,
      metadata: {
        popupType: "timer",
        timeRemaining: timerEndTime - Date.now(),
      },
    });

    // Use the pre-configured discount code from admin settings
    const discountCode = popupConfig.discountCode || "TIMER10";

    // Track conversion for timer popup
    trackEvent("win", {
      email: email,
      discountCode: discountCode,
      prizeLabel: "Timer Discount",
      metadata: {
        popupType: "timer",
        preconfigured: true,
        timeRemaining: timerEndTime - Date.now(),
      },
    });

    // Show success message with discount code
    const timerContent = document.querySelector(
      ".timer-content .timer-popup-inner",
    );
    timerContent.innerHTML = `
      <button class="popup-close" onclick="closePopup()" style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        color: white;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 10;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">&times;</button>
      
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
        <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 15px 0; color: #ffffff;">
          ${popupConfig.successTitle || "SUCCESS!"}
        </h2>
        <p style="margin-bottom: 25px; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
          ${popupConfig.successMessage || "You've claimed your exclusive discount! Here's your code:"}
        </p>
        <div class="timer-discount-code" onclick="copyDiscountCode()">
          <div class="timer-discount-code-text" id="discount-code">
            ${discountCode}
          </div>
          <div class="timer-discount-hint">
            Click to copy to clipboard
          </div>
        </div>
        <button class="timer-cta-button" id="copy-btn" onclick="copyDiscountCode()" style="margin-bottom: 15px; max-width: 250px;">
          📋 Copy Code
        </button>
        <button class="timer-cta-button" onclick="window.closePopup()" style="
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          max-width: 200px;
        ">
          Continue Shopping
        </button>
      </div>
    `;

    // Stop the timer since user has converted
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  }//handleTimerSubmit

  // Make timer functions globally accessible
  window.handleTimerSubmit = handleTimerSubmit;

  // Scratch card popup functionality
  let scratchCanvas = null;
  let scratchCtx = null;
  let isScratching = false;
  let scratchRevealed = false;

  function initializeScratchCardPopup(config, scratchCardContent) {
    const scratchCardInner = scratchCardContent.querySelector(
      ".scratch-card-popup-inner",
    );

    // Generate random discount percentage (5%, 10%, 15%, 20%, 25%, 30%)
    const discountOptions = [5, 10, 15, 20, 25, 30];
    const randomDiscount =
      discountOptions[Math.floor(Math.random() * discountOptions.length)];

    // Responsive canvas size based on screen size
    let canvasSize, discountFontSize, discountTextSize;
    if (window.innerWidth <= 480) {
      canvasSize = 160;
      discountFontSize = "36px";
      discountTextSize = "18px";
    } else if (window.innerWidth <= 768) {
      canvasSize = 160;
      discountFontSize = "40px";
      discountTextSize = "20px";
    } else {
      canvasSize = 200;
      discountFontSize = "48px";
      discountTextSize = "18px";
    }

    scratchCardInner.innerHTML = `
      <button class="popup-close" onclick="closePopup()" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(0, 0, 0, 0.1);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        color: ${config.textColor || "#000000"};
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      ">&times;</button>
      
      <div class="scratch-card-layout">
        <div class="scratch-card-left">
          <div class="scratch-card-container" style="position: relative;">
            <canvas id="scratch-canvas" width="${canvasSize}" height="${canvasSize}" style="pointer-events: none; opacity: 0.5;"></canvas>
            <div class="scratch-card-hidden-content" id="hidden-discount" style="
              position: absolute;
              top: 0;
              left: 0;
              width: ${canvasSize}px;
              height: ${canvasSize}px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              opacity: 0;
              border-radius: 8px;
            ">
              <div class="discount-percentage" style="font-size: ${discountFontSize}; font-weight: bold; margin-bottom: 5px;">${randomDiscount}%</div>
              <div class="discount-text" style="font-size: ${discountTextSize}; font-weight: 600;">OFF</div>
            </div>
          </div>
          <p class="scratch-instruction" id="scratch-instruction">Enter your email to start scratching!</p>
        </div>
        
        <div class="scratch-card-right">
          <h2 class="scratch-card-title">${config.title || "Scratch & Win!"}</h2>
          <p class="scratch-card-description">${config.description || "Enter your email first, then scratch the card to reveal your exclusive discount!"}</p>
          
          <div class="scratch-card-form" id="scratch-form">
            <input type="email" id="scratch-email" placeholder="${config.placeholder || "Enter your email"}" class="scratch-email-input" />
            <label class="scratch-checkbox-container">
              <input type="checkbox" id="scratch-terms" class="scratch-checkbox" />
              <span class="scratch-checkmark"></span>
              <span class="scratch-checkbox-text">I agree to receive promotional emails</span>
            </label>
            <button onclick="enableScratchCard(${randomDiscount})" class="scratch-submit-btn" id="enable-scratch-btn" disabled>
              Enable Scratching
            </button>
          </div>
        </div>
      </div>
    `;

    // Initialize scratch canvas after DOM is ready
    setTimeout(() => {
      initializeScratchCanvas(randomDiscount);
    }, 100);
  }//initializeScratchCardPopup ends 

  function initializeScratchCanvas(discount) {
    scratchCanvas = document.getElementById("scratch-canvas");
    if (!scratchCanvas) return;

    scratchCtx = scratchCanvas.getContext("2d");

    // Get responsive canvas size from the canvas element
    const canvasSize = scratchCanvas.width; // This will be set by the responsive HTML

    // Responsive font sizes based on canvas size
    let fontSize, iconSize;
    if (canvasSize <= 160) {
      fontSize = "14px";
      iconSize = "18px";
    } else {
      fontSize = "16px";
      iconSize = "20px";
    }

    // Create scratch surface (blue background)
    scratchCtx.fillStyle = "#4A90E2";
    scratchCtx.fillRect(0, 0, canvasSize, canvasSize);

    // Add scratch surface pattern/texture
    scratchCtx.fillStyle = "#5BA0F2";
    const patternSize = Math.floor(canvasSize / 10);
    for (let i = 0; i < canvasSize; i += patternSize) {
      for (let j = 0; j < canvasSize; j += patternSize) {
        if ((i + j) % (patternSize * 2) === 0) {
          scratchCtx.fillRect(i, j, patternSize / 2, patternSize / 2);
        }
      }
    }

    // Add "SCRATCH HERE" text
    scratchCtx.fillStyle = "#FFFFFF";
    scratchCtx.font = `bold ${fontSize} Arial`;
    scratchCtx.textAlign = "center";
    scratchCtx.fillText("SCRATCH", canvasSize / 2, canvasSize / 2 - 10);
    scratchCtx.fillText("HERE", canvasSize / 2, canvasSize / 2 + 10);

    // Add small scratch icon
    scratchCtx.font = `${iconSize} Arial`;
    scratchCtx.fillText("✋", canvasSize / 2, canvasSize / 2 + 35);

    // Set up scratch functionality
    scratchCtx.globalCompositeOperation = "destination-out";

    // Mouse events
    scratchCanvas.addEventListener("mousedown", startScratching);
    scratchCanvas.addEventListener("mousemove", scratch);
    scratchCanvas.addEventListener("mouseup", stopScratching);
    scratchCanvas.addEventListener("mouseleave", stopScratching);

    // Touch events for mobile
    scratchCanvas.addEventListener("touchstart", handleTouchStart);
    scratchCanvas.addEventListener("touchmove", handleTouchMove);
    scratchCanvas.addEventListener("touchend", stopScratching);

    // Enable form validation
    setupScratchFormValidation();
  }//initializeScratchCanvas ends

  function startScratching(e) {
    // Check if scratching is enabled
    const canvas = document.getElementById("scratch-canvas");
    if (canvas.style.pointerEvents === "none") {
      return; // Don't allow scratching if disabled
    }
    isScratching = true;
    scratch(e);
  }//startScratching ends

  function scratch(e) {
    if (!isScratching) return;

    const rect = scratchCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale coordinates to canvas size
    const scaleX = scratchCanvas.width / rect.width;
    const scaleY = scratchCanvas.height / rect.height;

    // Responsive scratch radius based on canvas size
    const scratchRadius = scratchCanvas.width <= 160 ? 12 : 15;

    scratchCtx.beginPath();
    scratchCtx.arc(x * scaleX, y * scaleY, scratchRadius, 0, 2 * Math.PI);
    scratchCtx.fill();

    // Check if enough area is scratched
    checkScratchProgress();
  }//scratch ends

  function stopScratching() {
    isScratching = false;
  }

  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    scratchCanvas.dispatchEvent(mouseEvent);
  }//handleTouchStart ends

  function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    scratchCanvas.dispatchEvent(mouseEvent);
  }//handleTouchMove ends

  function checkScratchProgress() {
    if (scratchRevealed) return;

    const imageData = scratchCtx.getImageData(
      0,
      0,
      scratchCanvas.width,
      scratchCanvas.height,
    );
    const pixels = imageData.data;
    let transparentPixels = 0;

    // Count transparent pixels
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const totalPixels = scratchCanvas.width * scratchCanvas.height;
    const scratchedPercentage = (transparentPixels / totalPixels) * 100;

    // If 30% or more is scratched, reveal the discount
    if (scratchedPercentage > 30) {
      revealDiscount();
    }
  }//checkScratchProgress ends

  function revealDiscount() {
    if (scratchRevealed) return;

    scratchRevealed = true;

    // Clear the entire canvas to reveal the hidden content
    scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);

    // Show hidden content
    const hiddenContent = document.getElementById("hidden-discount");
    if (hiddenContent) {
      hiddenContent.style.opacity = "1";
    }

    // Enable the submit button since scratch is now revealed
    const submitBtn = document.querySelector(".scratch-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
    }

    // Track scratch reveal event
    trackEvent("scratch_revealed", {
      metadata: {
        popupType: "scratch-card",
      },
    });
  }//revealDiscount ends

  function setupScratchFormValidation() {
    const emailInput = document.getElementById("scratch-email");
    const termsCheckbox = document.getElementById("scratch-terms");
    const submitBtn = document.querySelector(".scratch-submit-btn");

    function validateForm() {
      const emailValid = emailInput.value && emailInput.value.includes("@");
      const termsChecked = termsCheckbox.checked;

      // For the initial "Enable Scratching" button, only check email and terms
      submitBtn.disabled = !(emailValid && termsChecked);
    }

    emailInput.addEventListener("input", validateForm);
    termsCheckbox.addEventListener("change", validateForm);
  }//setupScratchFormValidation ends

  // New function to enable scratch card after email entry
  function enableScratchCard(discount) {
    const email = document.getElementById("scratch-email")?.value;
    const termsChecked = document.getElementById("scratch-terms")?.checked;

    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!termsChecked) {
      alert("Please agree to receive promotional emails.");
      return;
    }

    // Track email entered
    trackEvent("email_entered", {
      email: email,
      metadata: {
        popupType: "scratch-card",
        discount: discount,
      },
    });

    // Enable the scratch canvas
    const canvas = document.getElementById("scratch-canvas");
    const instruction = document.getElementById("scratch-instruction");
    const submitBtn = document.getElementById("enable-scratch-btn");

    canvas.style.pointerEvents = "auto";
    canvas.style.opacity = "1";
    instruction.textContent = "Now scratch to reveal your discount!";

    // Change button to claim button (disabled until scratched)
    submitBtn.textContent = popupConfig.buttonText || "CLAIM DISCOUNT";
    submitBtn.onclick = () => handleScratchCardSubmit(discount);
    submitBtn.disabled = true; // Will be enabled when scratch is revealed

    // Store email for later use
    window.scratchCardEmail = email;
  }//enableScratchCard ends

  // Scratch card form submission handler
  async function handleScratchCardSubmit(discount) {
    const email =
      window.scratchCardEmail ||
      document.getElementById("scratch-email")?.value;

    if (!scratchRevealed) {
      alert("Please scratch the card first to reveal your discount.");
      return;
    }

    // Use the configured discount code or generate one
    const discountCode = popupConfig.discountCode || `SCRATCH${discount}`;

    // Track win event for scratch card
    trackEvent("win", {
      email: email,
      discountCode: discountCode,
      prizeLabel: `${discount}% OFF`,
      metadata: {
        popupType: "scratch-card",
        preconfigured: true,
      },
    });

    // Show success message
    showScratchCardSuccess(discount, discountCode);
  }//handleScratchCardSubmit

  function showScratchCardSuccess(discount, discountCode) {
    const scratchCardInner = document.querySelector(
      ".scratch-card-popup-inner",
    );

    scratchCardInner.innerHTML = `
      <button class="popup-close" onclick="closePopup()" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(0, 0, 0, 0.1);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        color: #000000;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      ">&times;</button>
      
      <div class="scratch-card-success" style="
        text-align: center;
        padding: 40px 30px;
        max-width: 500px;
        margin: 0 auto;
      ">
        <h2 style="
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #000000;
        ">Congratulations!</h2>
        
        <p style="
          font-size: 16px;
          color: #333333;
          margin: 0 0 30px 0;
          line-height: 1.5;
        ">Welcome to our loyalty program! Use the promo code below to get ${discount}% on your next purchase. We're glad to have you with us!</p>
        
        <div onclick="copyDiscountCode()" style="
          background: #ffffff;
          border: 2px dashed #007bff;
          border-radius: 8px;
          padding: 20px;
          margin: 0 auto 25px auto;
          cursor: pointer;
          transition: all 0.3s ease;
          max-width: 300px;
        " onmouseover="this.style.borderColor='#0056b3'" onmouseout="this.style.borderColor='#007bff'">
          <div style="
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
          " id="discount-code">${discountCode}</div>
          <div style="
            font-size: 12px;
            color: #666666;
            font-style: italic;
          ">📋 Click to copy</div>
        </div>
        
        <button id="copy-btn" onclick="copyDiscountCode()" style="
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;
          color: white;
          padding: 12px 30px;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          margin: 0 10px 15px 10px;
          font-size: 14px;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          📋 Copy Code
        </button>
        
        <button onclick="window.closePopup()" style="
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          border: none;
          color: white;
          padding: 12px 30px;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          margin: 0 10px;
          font-size: 14px;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          Continue Shopping
        </button>
      </div>
    `;
  }//showScratchCardSuccess ends

  // Make scratch card functions globally accessible
  window.handleScratchCardSubmit = handleScratchCardSubmit;
  window.enableScratchCard = enableScratchCard;

  // Embedded function: wheel handler
  function handleWheelSpin() {
    const wheel = document.getElementById("spinning-wheel");
    wheel.classList.add("spinning");
    setTimeout(() => {
      wheel.classList.remove("spinning");
      const segments = popupConfig.segments || [];
      const prize = segments[Math.floor(Math.random() * segments.length)];
      alert(`🎉 You won: ${prize.label}`);
      window.closePopup();
    }, 2000);
  }//handleWheelSpin ends here

  // Init
  document.addEventListener("DOMContentLoaded", async () => {
    popupConfig = await fetchPopupConfig();
    if (!popupConfig?.isActive) return;

    if (popupConfig.exitIntent) {
      document.addEventListener("mouseout", (e) => {
        if (e.clientY <= 0 && !exitIntentTriggered) {
          exitIntentTriggered = true;
          showPopup(popupConfig);
        }
      });
    } else {
      setTimeout(
        () => showPopup(popupConfig),
        popupConfig.displayDelay || 3000,
      );
    }
  });

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (e.target.id === "custom-popup-overlay") window.closePopup();
  });

  // Unload cleanup
  window.addEventListener("beforeunload", () => {
    popupConfig = null;
    popupShown = false;
  });
})();
