import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Homestay/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows search widget with nightly/hourly tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/đặt theo đêm/i).or(page.getByText(/đặt theo giờ/i))).toBeVisible();
  });

  test('shows featured rooms section', async ({ page }) => {
    await page.goto('/');
    // Featured rooms heading
    await expect(
      page.getByRole('heading', { name: /phòng nổi bật|phòng đang có sẵn/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to rooms listing from CTA', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /xem tất cả phòng/i }).first().click();
    await expect(page).toHaveURL(/\/rooms/);
  });
});
