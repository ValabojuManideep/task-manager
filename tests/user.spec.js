
import { test, expect } from './fixtures/user-fixture';

/* ============================================================
   User – Dashboard
   ============================================================ */
test.describe('User – Dashboard', () => {

  test('Dashboard loads with task stats and recent tasks', async ({ userPage }) => {

    await expect(
      userPage.getByRole('heading', { name: /dashboard/i })
    ).toBeVisible();

    // Scope to the statistics overview region for precise matching
    const statsRegion = userPage.getByRole('region', { name: /statistics overview/i });
    for (const stat of ['Total Tasks', 'Completed', 'In Progress']) {
      await expect(statsRegion.getByText(stat, { exact: true })).toBeVisible();
    }

    const completionCard = userPage.getByText('Completion Rate').locator('..');
    await expect(completionCard.getByText(/^[0-9]+%$/)).toBeVisible();

    // Recent Tasks
    const recentTask = userPage
      .getByText(/recent tasks/i)
      .locator('..')
      .locator('li')
      .first();

    if (await recentTask.count()) {
      await expect(recentTask).toBeVisible();
    }
  });
});

/* ============================================================
   User – Team Tasks
   ============================================================ */
test.describe('User – Team Tasks', () => {

  test('View, search, filter, start and complete team tasks', async ({ userPage }) => {
    // Navigate
    await userPage.locator('.navbar .nav-label', { hasText: 'Tasks' }).click();
    await userPage.getByRole('link', { name: /team tasks/i }).click();

    await expect(
      userPage.getByRole('heading', { name: /team tasks/i })
    ).toBeVisible();

    // --- Filter behavior: Click "Done" and validate only Done tasks appear ---
    const doneFilter = userPage.getByRole('button', { name: /^Done$/i });
    await expect(doneFilter).toBeVisible();
    await expect(doneFilter).toBeEnabled();
    await doneFilter.click();
    // Wait for tasks to update (networkidle or UI change)
    await userPage.waitForLoadState('networkidle');
    // Assert all visible tasks have status "done"
    const doneRows = userPage.locator('table.task-table tbody tr');
    const rowCount = await doneRows.count();
    for (let i = 0; i < rowCount; ++i) {
      const row = doneRows.nth(i);
      await expect(row.getByText(/done/i)).toBeVisible();
    }

    /* ---------- Filters ---------- */
    for (const status of ['All', 'To Do', 'In Progress', 'Done']) {
      await expect(
        userPage.getByRole('button', { name: new RegExp(`^${status}$`, 'i') })
      ).toBeVisible();
    }

    for (const priority of ['All Priority', 'High', 'Medium', 'Low']) {
      await expect(
        userPage.getByRole('button', { name: new RegExp(priority, 'i') })
      ).toBeVisible();
    }

    /* ---------- Search ---------- */
    const searchBox = userPage.getByPlaceholder('Search...');
    await expect(searchBox).toBeVisible();

    /* ---------- Interact with Task ---------- */
    const firstRow = userPage.locator('table.task-table tbody tr').first();

    if (await firstRow.count()) {
      await expect(firstRow).toBeVisible();

      /* ----- Start Task ----- */
      const startBtn = firstRow.getByRole('button', {
        name: /start|begin/i,
      });

      if (await startBtn.count()) {
        await startBtn.click();

        const swal = userPage.locator('.swal2-container');
        if (await swal.isVisible()) {
          await userPage.getByRole('button', {
            name: /yes, proceed|confirm/i,
          }).click();
          await expect(swal).toBeHidden();
        }
      }

      /* ----- Mark Done ----- */
      const doneBtn = firstRow.getByRole('button', {
        name: /done|✓ done|mark as done/i,
      });

      if (await doneBtn.count()) {
        await doneBtn.click();

        const swal = userPage.locator('.swal2-container');
        if (await swal.isVisible()) {
          await userPage.getByRole('button', {
            name: /yes, proceed|confirm/i,
          }).click();
          await expect(swal).toBeHidden();
        }
      }

      /* ----- Comments ----- */
      const commentsBtn = firstRow.locator('button.comments-btn');
      if (await commentsBtn.count()) {
        await commentsBtn.click();
        await expect(
          userPage.getByText(/comments|add comment/i)
        ).toBeVisible();

        await userPage
          .getByPlaceholder(/add a comment/i)
          .fill('Comment added by User E2E');

        await userPage.getByRole('button', { name: /add|post/i }).click();

        await expect(
          userPage.getByText(/comment added successfully/i)
        ).toBeVisible();
      }
    }
  });
});

/* ============================================================
   User – User Tasks
   ============================================================ */
test.describe('User – User Tasks', () => {

  test('View, search, filter, start and complete user tasks', async ({ userPage }) => {

    // Navigate
    await userPage.locator('.navbar .nav-label', { hasText: 'Tasks' }).click();
    await userPage.getByRole('link', { name: /user tasks/i }).click();

    await expect(
      userPage.getByRole('heading', { name: /user tasks/i })
    ).toBeVisible();

    /* ---------- Filters ---------- */
    for (const status of ['All', 'To Do', 'In Progress', 'Done']) {
      await expect(
        userPage.getByRole('button', { name: new RegExp(`^${status}$`, 'i') })
      ).toBeVisible();
    }

    /* ---------- Search ---------- */
    const searchBox = userPage.getByPlaceholder('Search...');
    await expect(searchBox).toBeVisible();

    /* ---------- Task Actions ---------- */
    const firstRow = userPage.locator('table.task-table tbody tr').first();

    if (await firstRow.count()) {
      await expect(firstRow).toBeVisible();

      // Start
      const startBtn = firstRow.getByRole('button', {
        name: /start|begin/i,
      });

      if (await startBtn.count()) {
        await startBtn.click();
      }

      // Mark Done
      const doneBtn = firstRow.getByRole('button', {
        name: /done|✓ done|mark as done/i,
      });

      if (await doneBtn.count()) {
        await doneBtn.click();
      }

      // Comments
      const commentsBtn = firstRow.locator('button.comments-btn');
      if (await commentsBtn.count()) {
        await commentsBtn.click();
        await expect(
          userPage.getByText(/comments|add comment/i)
        ).toBeVisible();
      }
    }
  });
});

/* ============================================================
   User – Analytics
   ============================================================ */
test.describe('User – Analytics', () => {

  test('Analytics page loads with charts and stats', async ({ userPage }) => {
    await userPage.locator('.navbar .nav-label', { hasText: 'Analytics' }).click();
    await expect(userPage.getByRole('heading', { name: /analytics/i })).toBeVisible();
    for (const stat of [
      'TOTAL TASKS',
      'COMPLETED',
      'IN PROGRESS',
      'COMPLETION RATE',
    ]) {
      await expect(userPage.getByText(stat)).toBeVisible();
    }
    await expect(userPage.locator('svg, canvas')).toBeVisible();
  });

  test('Export Data button downloads JSON or Excel', async ({ userPage }) => {
    const fs = require('fs');
    // Navigate to Analytics page
    await userPage.locator('.navbar .nav-label', { hasText: 'Analytics' }).click();
    await expect(userPage.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Find and click Export Data button
    const exportBtn = userPage.getByRole('button', { name: /export data/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Check for JSON and Excel options (as buttons)
    const jsonOption = userPage.getByRole('button', { name: /json/i });
    const excelOption = userPage.getByRole('button', { name: /excel/i });
    await expect(jsonOption).toBeVisible();
    await expect(excelOption).toBeVisible();

    // Download after clicking JSON button
    const [firstDownload] = await Promise.all([
      userPage.waitForEvent('download'),
      jsonOption.click(),
    ]);
    const firstPath = await firstDownload.path();
    expect(firstDownload.suggestedFilename()).toMatch(/\.(json|xlsx?|xls)$/);
    const firstBuffer = fs.readFileSync(firstPath);
    expect(firstBuffer.length).toBeGreaterThan(0);

    // Re-open menu for Excel (if menu closes after click)
    await exportBtn.click();
    // Download after clicking Excel button
    const [secondDownload] = await Promise.all([
      userPage.waitForEvent('download'),
      excelOption.click(),
    ]);
    const secondPath = await secondDownload.path();
    expect(secondDownload.suggestedFilename()).toMatch(/\.(json|xlsx?|xls)$/);
    const secondBuffer = fs.readFileSync(secondPath);
    expect(secondBuffer.length).toBeGreaterThan(0);
  });
});

/* ============================================================
   User – Activity Log
   ============================================================ */
test.describe('User – Activity Log', () => {

  test('View activity log and filters', async ({ userPage }) => {
    await userPage.locator('.navbar .nav-label', { hasText: 'Activity' }).click();
    await expect(
      userPage.getByRole('heading', { name: /activity log/i })
    ).toBeVisible();
    for (const filter of ['All', 'Task', 'System']) {
      const btn = userPage.getByRole('button', {
        name: new RegExp(filter, 'i'),
      });
      if (await btn.count()) {
        await btn.click();
      }
    }
    // Wait for network to settle
    await userPage.waitForLoadState('networkidle');
    // Assert at least one activity entry is visible (since test data is seeded)
    await expect(
      userPage.locator('text=/commented on|created|updated|completed/i').first()
    ).toBeVisible();
  });
});

/* ============================================================
   User – Profile
   ============================================================ */
test.describe('User – Profile', () => {

  test('Profile page loads with user details', async ({ userPage }) => {

    await userPage.locator('.navbar .nav-label', { hasText: 'Profile' }).click();

    await expect(userPage.getByRole('heading', { name: /sravani/i })).toBeVisible();

    const emailRow = userPage.getByText(/^Email$/i).locator('..');
    await expect(emailRow).toContainText(/@/);

    const roleRow = userPage.getByText(/^Role$/i).locator('..');
    await expect(roleRow).toContainText(/user/i);

    await expect(userPage.getByText(/joined/i)).toBeVisible();
  });
});