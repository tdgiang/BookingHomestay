-- CreateIndex
CREATE INDEX "bookings_roomId_checkIn_checkOut_status_deletedAt_idx" ON "bookings"("roomId", "checkIn", "checkOut", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "bookings_status_deletedAt_createdAt_idx" ON "bookings"("status", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_guestId_deletedAt_idx" ON "bookings"("guestId", "deletedAt");

-- CreateIndex
CREATE INDEX "guests_phone_deletedAt_idx" ON "guests"("phone", "deletedAt");

-- CreateIndex
CREATE INDEX "guests_deletedAt_createdAt_idx" ON "guests"("deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "room_prices_roomId_priceType_idx" ON "room_prices"("roomId", "priceType");

-- CreateIndex
CREATE INDEX "rooms_isActive_deletedAt_idx" ON "rooms"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "rooms_capacity_isActive_deletedAt_idx" ON "rooms"("capacity", "isActive", "deletedAt");
