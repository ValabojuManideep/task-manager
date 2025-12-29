import { test as base, expect, Page } from '@playwright/test';

type UserFixtures = {
  userPage: Page;
};

export const test = base.extend<UserFixtures>({
  userPage: async ({ page }, use) => {

    const email = process.env.USER_EMAIL ?? 'laxmisravanibulusu@gmail.com';
    const password = process.env.USER_PASSWORD ?? '1234';

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Username or Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    // Check for login error before waiting for navbar
    if (await page.getByText(/login failed|invalid/i).isVisible({ timeout: 3000 }).catch(() => false)) {
      throw new Error('Login failed: check credentials or test user setup');
    }
    await expect(page.locator('.navbar')).toBeVisible({ timeout: 20000 });

    await use(page);
  },
});

export { expect };