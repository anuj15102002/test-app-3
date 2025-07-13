-- CreateTable
CREATE TABLE "PopupAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "email" TEXT,
    "discountCode" TEXT,
    "prizeLabel" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- CreateIndex
CREATE INDEX "PopupAnalytics_shop_idx" ON "PopupAnalytics"("shop");

-- CreateIndex
CREATE INDEX "PopupAnalytics_eventType_idx" ON "PopupAnalytics"("eventType");

-- CreateIndex
CREATE INDEX "PopupAnalytics_timestamp_idx" ON "PopupAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "PopupAnalytics_shop_eventType_idx" ON "PopupAnalytics"("shop", "eventType");