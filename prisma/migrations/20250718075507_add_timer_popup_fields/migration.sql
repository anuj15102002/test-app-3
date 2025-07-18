-- Add timer popup specific fields to PopupConfig table
ALTER TABLE `PopupConfig` ADD COLUMN `timerDays` INT NULL DEFAULT 0;
ALTER TABLE `PopupConfig` ADD COLUMN `timerHours` INT NULL DEFAULT 0;
ALTER TABLE `PopupConfig` ADD COLUMN `timerMinutes` INT NULL DEFAULT 5;
ALTER TABLE `PopupConfig` ADD COLUMN `timerSeconds` INT NULL DEFAULT 0;
ALTER TABLE `PopupConfig` ADD COLUMN `timerIcon` VARCHAR(191) NULL DEFAULT '⏰';
ALTER TABLE `PopupConfig` ADD COLUMN `onExpiration` VARCHAR(191) NULL DEFAULT 'show_expired';
ALTER TABLE `PopupConfig` ADD COLUMN `expiredTitle` VARCHAR(191) NULL DEFAULT 'OFFER EXPIRED';
ALTER TABLE `PopupConfig` ADD COLUMN `expiredMessage` TEXT NULL;
ALTER TABLE `PopupConfig` ADD COLUMN `expiredIcon` VARCHAR(191) NULL DEFAULT '⏰';
ALTER TABLE `PopupConfig` ADD COLUMN `expiredButtonText` VARCHAR(191) NULL DEFAULT 'CONTINUE SHOPPING';
ALTER TABLE `PopupConfig` ADD COLUMN `successTitle` VARCHAR(191) NULL DEFAULT 'SUCCESS!';
ALTER TABLE `PopupConfig` ADD COLUMN `successMessage` TEXT NULL;
ALTER TABLE `PopupConfig` ADD COLUMN `disclaimer` TEXT NULL;