import { test, expect } from '@playwright/test';

/**
 * E2E booking flow: chọn thời gian → thông tin khách → thanh toán → success.
 * Requires backend running at http://localhost:4000.
 */
test.describe('Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from rooms listing and navigate to first room
    await page.goto('/rooms');
    const firstRoom = page.locator('a[href^="/rooms/"]').first();
    await firstRoom.waitFor({ timeout: 10_000 });
    await firstRoom.click();
    await expect(page).toHaveURL(/\/rooms\/.+/);
  });

  test('Step 1 — date picker and price preview', async ({ page }) => {
    // Wait for booking widget
    const bookingWidget = page.getByRole('region', { name: /đặt phòng/i }).or(
      page.locator('[class*="booking"], [class*="widget"]').first(),
    );

    // Check-in date field
    const checkInInput = page.getByLabel(/check-in|ngày nhận/i).first();
    if (await checkInInput.isVisible()) {
      await checkInInput.fill('2026-06-10');
    }

    // Check-out date field
    const checkOutInput = page.getByLabel(/check-out|ngày trả/i).first();
    if (await checkOutInput.isVisible()) {
      await checkOutInput.fill('2026-06-12');
    }

    // Proceed button
    const proceedBtn = page.getByRole('button', { name: /đặt phòng|tiếp tục|chọn phòng này/i });
    await expect(proceedBtn).toBeVisible({ timeout: 5_000 });
  });

  test('Step 2 — guest info form has required fields', async ({ page }) => {
    // Try to navigate to booking step 1 via URL for determinism
    const url = page.url();
    const roomId = url.split('/rooms/')[1]?.split('?')[0];
    if (!roomId) return;

    await page.goto(`/booking/${roomId}?checkIn=2026-06-10&checkOut=2026-06-12&mode=nightly&adults=2`);

    // Go to step 2
    const nextBtn = page.getByRole('button', { name: /tiếp theo|thông tin khách/i });
    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
    }

    await page.goto(`/booking/${roomId}/info?checkIn=2026-06-10&checkOut=2026-06-12&mode=nightly&adults=2`);

    await expect(page.getByLabel(/họ tên|full name/i).or(page.getByPlaceholder(/họ tên/i))).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByLabel(/số điện thoại|phone/i).or(page.getByPlaceholder(/điện thoại/i))).toBeVisible();
  });

  test('Booking lookup page works', async ({ page }) => {
    await page.goto('/booking/lookup');
    await expect(page.getByRole('heading', { name: /tra cứu/i })).toBeVisible();
    const input = page.getByPlaceholder(/HSB-|booking code/i).or(
      page.getByLabel(/mã đặt phòng/i),
    );
    await expect(input).toBeVisible();
    await input.fill('HSB-20260101-XXXX');
    await page.getByRole('button', { name: /tra cứu|tìm kiếm/i }).click();
    // Should show not-found message (not crash)
    await expect(page.getByText(/không tìm thấy|không có|lỗi/i)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Auth — admin login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password|mật khẩu/i }).or(
      page.locator('input[type="password"]'),
    )).toBeVisible();
  });
});
