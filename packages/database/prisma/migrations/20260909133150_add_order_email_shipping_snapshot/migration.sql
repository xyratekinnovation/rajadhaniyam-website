/*
  Warnings:

  - Added the required column `email` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingSnapshot` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "shippingSnapshot" JSONB NOT NULL;
