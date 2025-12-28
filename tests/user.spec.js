import { test, expect } from '@playwright/test';

// Utility: login as user
export async function loginAsUser(page) {
  await page.goto('https://task-manager-vert-phi-84.vercel.app/login');
  await page.getByLabel('Username or Email').fill('sravani');
  await page.getByLabel('Password').fill('1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/login/);
}

test('user dashboard loads', async ({ page }) => {
  await loginAsUser(page);
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
