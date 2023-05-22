-- DropForeignKey
ALTER TABLE `Memory` DROP FOREIGN KEY `Memory_userId_fkey`;

-- RenameIndex
ALTER TABLE `Memory` RENAME INDEX `Memory_userId_fkey` TO `Memory_userId_idx`;
