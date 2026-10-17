-- Two-level category taxonomy: parent categories (parent_id IS NULL)
-- and subcategories that belong to one parent (e.g. Cakes → Birthday Cakes).
ALTER TABLE "Categories" ADD COLUMN "parent_id" INTEGER;

-- CreateIndex
CREATE INDEX "Categories_parent_id_idx" ON "Categories"("parent_id");

-- AddForeignKey
ALTER TABLE "Categories" ADD CONSTRAINT "Categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;