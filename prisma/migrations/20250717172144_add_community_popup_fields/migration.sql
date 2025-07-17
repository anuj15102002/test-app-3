/*
  Warnings:

  - You are about to drop the column `pageTargeting` on the `PopupConfig` table. All the data in the column will be lost.
  - You are about to drop the column `targetAllPages` on the `PopupConfig` table. All the data in the column will be lost.
  - You are about to drop the column `targetSpecificPages` on the `PopupConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PopupConfig` DROP COLUMN `pageTargeting`,
    DROP COLUMN `targetAllPages`,
    DROP COLUMN `targetSpecificPages`,
    ADD COLUMN `askMeLaterText` VARCHAR(191) NULL,
    ADD COLUMN `bannerImage` TEXT NULL,
    ADD COLUMN `showAskMeLater` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `socialIcons` TEXT NULL;
