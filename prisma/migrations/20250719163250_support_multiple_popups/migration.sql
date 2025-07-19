-- DropIndex
DROP INDEX `PopupConfig_shop_key` ON `PopupConfig`;

-- AlterTable
ALTER TABLE `PopupConfig` ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT 'Untitled Popup';

-- CreateIndex
CREATE INDEX `PopupConfig_shop_idx` ON `PopupConfig`(`shop`);

-- CreateIndex
CREATE INDEX `PopupConfig_shop_isActive_idx` ON `PopupConfig`(`shop`, `isActive`);
