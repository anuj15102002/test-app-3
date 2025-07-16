-- AlterTable
ALTER TABLE `PopupConfig` ADD COLUMN `pageTargeting` TEXT NULL,
ADD COLUMN `targetAllPages` BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN `targetSpecificPages` BOOLEAN NOT NULL DEFAULT false;