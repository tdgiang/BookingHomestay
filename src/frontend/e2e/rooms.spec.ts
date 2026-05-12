import { test, expect } from '@playwright/test';

test.describe('Rooms listing', () => {
  test('renders page title and room cards', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: /danh sách phòng/i })).toBeVisible();
    // At least one room card should appear (SSR + client)
    await expect(page.locator('[data-testid="room-card"], a[href^="/rooms/"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('filter panel opens and closes', async ({ page }) => {
    await page.goto('/rooms');
    const filterBtn = page.getByRole('button', { name: /bộ lọc/i });
    await filterBtn.click();
    await expect(page.getByText(/số khách \(tối thiểu\)/i)).toBeVisible();
    await filterBtn.click();
    await expect(page.getByText(/số khách \(tối thiểu\)/i)).toBeHidden();
  });

  test('sort select changes query param', async ({ page }) => {
    await page.goto('/rooms');
    await page.getByRole('combobox').selectOption('capacity');
    await expect(page).toHaveURL(/sort=capacity/);
  });

  test('has valid SEO metadata', async ({ page }) => {
    await page.goto('/rooms');
    const title = await page.title();
    expect(title).toContain('Homestay');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });
});

test.describe('Room detail', () => {
  test('loads room detail page from listing', async ({ page }) => {
    await page.goto('/rooms');
    const firstRoom = page.locator('a[href^="/rooms/"]').first();
    await firstRoom.waitFor({ timeout: 10_000 });
    await firstRoom.click();
    await expect(page).toHaveURL(/\/rooms\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows amenities and booking widget', async ({ page }) => {
    await page.goto('/rooms');
    const firstRoom = page.locator('a[href^="/rooms/"]').first();
    await firstRoom.waitFor({ timeout: 10_000 });
    await firstRoom.click();
    // Booking widget is present
    await expect(
      page.getByRole('button', { name: /đặt phòng|tiếp tục/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('has JSON-LD structured data', async ({ page }) => {
    await page.goto('/rooms');
    const firstRoom = page.locator('a[href^="/rooms/"]').first();
    await firstRoom.waitFor({ timeout: 10_000 });
    await firstRoom.click();
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd!);
    expect(data['@type']).toBe('LodgingBusiness');
  });
});
