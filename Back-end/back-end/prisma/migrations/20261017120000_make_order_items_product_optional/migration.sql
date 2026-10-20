-- Allow OrderItems.product_id to be NULL and set it to NULL when the
-- referenced product is deleted, so products can be permanently removed
-- without breaking historical orders (RESTRICT would block the delete).
ALTER TABLE "OrderItems" ALTER COLUMN "product_id" DROP NOT NULL;

ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_product_id_fkey";

ALTER TABLE "OrderItems" ADD CONSTRAINT "OrderItems_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
