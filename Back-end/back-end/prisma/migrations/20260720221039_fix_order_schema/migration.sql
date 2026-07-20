-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "customer_email" TEXT,
ADD COLUMN     "customer_phone" TEXT;

-- CreateTable
CREATE TABLE "OrderReturns" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReturns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusLogs" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "old_status" INTEGER NOT NULL,
    "new_status" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderReturns" ADD CONSTRAINT "OrderReturns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturns" ADD CONSTRAINT "OrderReturns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusLogs" ADD CONSTRAINT "OrderStatusLogs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
