import { test as base, expect, Page } from '@playwright/test';

type AdminFixtures = {
  adminPage: Page;
};

export const test = base.extend<AdminFixtures>({
  adminPage: async ({ page }, use) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Username or Email').fill('mani2@gmail.com');
    await page.getByLabel('Password').fill('1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Wait for a global authenticated-only element (sidebar)
    await expect(
      page.locator('.navbar')
    ).toBeVisible({ timeout: 20000 });
    await use(page);
  },
});

export { expect };
