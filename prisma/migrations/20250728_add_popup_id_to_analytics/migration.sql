-- Add popupId field to PopupAnalytics table
ALTER TABLE `PopupAnalytics` ADD COLUMN `popupId` VARCHAR(191) NULL;

-- Add index for better query performance
CREATE INDEX `PopupAnalytics_popupId_idx` ON `PopupAnalytics`(`popupId`);

-- Add composite index for shop and popupId queries
CREATE INDEX `PopupAnalytics_shop_popupId_idx` ON `PopupAnalytics`(`shop`, `popupId`);