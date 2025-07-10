-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PopupConfig" (
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
    "frequency" TEXT NOT NULL DEFAULT 'once',
    "exitIntent" BOOLEAN NOT NULL DEFAULT false,
    "exitIntentDelay" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PopupConfig" ("backgroundColor", "borderRadius", "buttonColor", "buttonText", "createdAt", "description", "discountCode", "displayDelay", "id", "isActive", "placeholder", "segments", "shop", "showCloseButton", "textColor", "title", "type", "updatedAt") SELECT "backgroundColor", "borderRadius", "buttonColor", "buttonText", "createdAt", "description", "discountCode", "displayDelay", "id", "isActive", "placeholder", "segments", "shop", "showCloseButton", "textColor", "title", "type", "updatedAt" FROM "PopupConfig";
DROP TABLE "PopupConfig";
ALTER TABLE "new_PopupConfig" RENAME TO "PopupConfig";
CREATE UNIQUE INDEX "PopupConfig_shop_key" ON "PopupConfig"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
