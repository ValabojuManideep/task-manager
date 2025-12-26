import { test, expect } from '@playwright/test';

// Utility: login as team manager
export async function loginAsTeamManager(page) {
  await page.goto('https://task-manager-vert-phi-84.vercel.app/login');
  await page.getByLabel('Username or Email').fill('user');
  await page.getByLabel('Password').fill('1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/login/);
}

test('team manager dashboard loads', async ({ page }) => {
  await loginAsTeamManager(page);
  await expect(page.getByRole('heading', { name: /team manager dashboard/i })).toBeVisible();
});
