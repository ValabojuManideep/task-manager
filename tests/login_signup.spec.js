import { test, expect } from '@playwright/test';

test('signup page loads and can submit', async ({ page }) => {
  await page.goto('https://task-manager-vert-phi-84.vercel.app/signup');

  await expect(
    page.getByRole('heading', { name: /create account/i })
  ).toBeVisible();

  await page.getByLabel('Username').fill('testuser' + Date.now());
  await page.getByLabel('Email').fill('testuser' + Date.now() + '@example.com');
  await page.getByLabel('Password').fill('TestPassword123!');
  await page.getByRole('button', { name: /sign up/i }).click();

  //Correct post-signup assertion: generic dashboard heading
  await expect(
    page.getByRole('heading', { name: /^dashboard$/i })
  ).toBeVisible({ timeout: 15000 });

  // ✅ Assert URL is home page after signup
  await expect(page).toHaveURL('https://task-manager-vert-phi-84.vercel.app/');
});

test('login page loads and can submit', async ({ page }) => {
  await page.goto('https://task-manager-vert-phi-84.vercel.app/login');

  await expect(
    page.getByRole('heading', { name: /welcome back/i })
  ).toBeVisible();

  await page.getByLabel('Username or Email').fill('user');
  await page.getByLabel('Password').fill('1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(
    page.getByRole('heading', { name: /team manager dashboard/i })
  ).toBeVisible({ timeout: 15000 });

  await expect(page).toHaveURL('https://task-manager-vert-phi-84.vercel.app/');
});


test('user can logout and is redirected to login', async ({ page }) => {
  // Login first
  await page.goto('https://task-manager-vert-phi-84.vercel.app/login');
  await page.getByLabel('Username or Email').fill('mani2');
  await page.getByLabel('Password').fill('1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible({ timeout: 15000 });

  // Click logout button (top right)
  await page.getByRole('button', { name: /logout from application|logout/i }).click();

  // Assert redirected to login page
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/login$/);
});