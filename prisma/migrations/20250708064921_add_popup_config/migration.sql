-- CreateTable
CREATE TABLE "PopupConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "placeholder" TEXT,
    "buttonText" TEXT NOT NULL,
    "discountCode" TEXT,
    "backgroundColor" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "buttonColor" TEXT,
    "borderRadius" INTEGER,
    "showCloseButton" BOOLEAN NOT NULL DEFAULT true,
    "displayDelay" INTEGER NOT NULL DEFAULT 3000,
    "segments" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PopupConfig_shop_key" ON "PopupConfig"("shop");
