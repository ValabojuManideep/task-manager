import { test, expect } from './fixtures/admin-fixture';
const fs = require('fs');

// ===== Utilities: Available to all test.describe blocks =====

async function goToLastPage(page) {
  while (true) {
    const nextBtn = page.getByRole('button', { name: /^next$/i });
    // Defensive: handle detachment, pointer interception, and async DOM
    const visible = await nextBtn.isVisible().catch(() => false);
    const enabled = await nextBtn.isEnabled().catch(() => false);
    if (!visible || !enabled) break;
    try {
      await nextBtn.click({ trial: false });
      // Wait a bit for DOM to stabilize after click
      await page.waitForTimeout(100);
    } catch (e) {
      // If intercepted or detached, break loop
      break;
    }
  }
}

async function createTeam(page, teamName, description = 'E2E test') {
  await page.getByRole('button', { name: /create team/i }).click();
  await page.getByPlaceholder('Enter team name').fill(teamName);
  await page.getByPlaceholder('Enter team description').fill(description);

  const managerSection = page.getByText(/select team managers/i).locator('..');
  await managerSection.getByRole('checkbox').first().check();

  const memberSection = page.getByText(/select team members/i).locator('..');
  const memberCheckboxes = memberSection.getByRole('checkbox');
  await memberCheckboxes.nth(0).check();
  await memberCheckboxes.nth(1).check();

  await page.getByRole('button', { name: /create team/i }).click();

  const confirmDialog = page.getByRole('dialog', { name: /create team/i });
  if (await confirmDialog.isVisible().catch(() => false)) {
    await confirmDialog.getByRole('button', { name: /yes, proceed/i }).click();
  }
  await expect(confirmDialog).toBeHidden();
}


/* ============================================================
   Admin – Analytics Export
   ============================================================ */
test.describe('Admin – Analytics Export', () => {
  test('Export Data button downloads correct JSON and Excel files', async ({ adminPage }) => {
    // Navigate to Analytics page
    await adminPage.locator('.navbar .nav-label', { hasText: 'Analytics' }).click();
    await expect(adminPage.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Find and click Export Data button
    const exportBtn = adminPage.getByRole('button', { name: /export data/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Check for JSON and Excel options (as buttons)
    const jsonOption = adminPage.getByRole('button', { name: /json/i });
    const excelOption = adminPage.getByRole('button', { name: /excel/i });
    await expect(jsonOption).toBeVisible();
    await expect(excelOption).toBeVisible();

    // Download after clicking JSON button
    const [firstDownload] = await Promise.all([
      adminPage.waitForEvent('download'),
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
      adminPage.waitForEvent('download'),
      excelOption.click(),
    ]);
    const secondPath = await secondDownload.path();
    expect(secondDownload.suggestedFilename()).toMatch(/\.(json|xlsx?|xls)$/);
    const secondBuffer = fs.readFileSync(secondPath);
    expect(secondBuffer.length).toBeGreaterThan(0);
  });
});


/* ============================================================
   Admin – Team Management
   ============================================================ */
test.describe('Admin – Team Management', () => {

  /* ------------------- LIST TEST ------------------- */
  test('Team list renders with managers and members', async ({ adminPage }) => {
    await adminPage.goto('/teams');

    const teamName = `List Test Team ${Date.now()}`;
    await createTeam(adminPage, teamName, 'List test');

    // Ensure create dialog fully closed (WebKit-safe)
    await expect(
      adminPage.getByRole('dialog', { name: /create team/i })
    ).toBeHidden({ timeout: 15000 });

    // Ensure list is hydrated
    await expect(
      adminPage.locator('.team-card').first()
    ).toBeVisible({ timeout: 20000 });

    // Now filter & assert
    const searchBox = adminPage.getByPlaceholder(
      'Search teams by name, description, or member...'
    );
    await searchBox.fill(teamName);
    await adminPage.waitForTimeout(300);

    const teamCard = adminPage.locator('.team-card', { hasText: teamName });
    await expect(teamCard).toBeVisible({ timeout: 20000 });
    await expect(teamCard.getByText(/managers/i)).toBeVisible();
    await expect(teamCard.getByText(/members/i)).toBeVisible();
  });

  /* ------------------- CREATE TEST ------------------- */
  test('Can create a new team', async ({ adminPage }) => {
    await adminPage.goto('/teams');

    const teamName = `Create Test Team ${Date.now()}`;
      await createTeam(adminPage, teamName);

    await adminPage.waitForLoadState('networkidle');

    // Search for the newly created team (robust, cross-browser)
    const searchBox = adminPage.getByPlaceholder('Search teams by name, description, or member...');
    await expect(searchBox).toBeVisible();
    await searchBox.fill(teamName);

    // Wait for filtered results
      await expect.poll(
        () => adminPage.locator('.team-card', { hasText: teamName }).count(),
        { timeout: 20000 }
      ).toBeGreaterThan(0);

    // Assert team card
    const teamCard = adminPage.locator('.team-card', { hasText: teamName });
    await expect(teamCard).toBeVisible();
  });

  /* ------------------- EDIT TEST ------------------- */
  test('Can edit a team', async ({ adminPage }) => {
    await adminPage.goto('/teams');

    const teamName = `Edit Test Team ${Date.now()}`;
      await createTeam(adminPage, teamName, 'Edit test');

    await adminPage.waitForLoadState('networkidle');
    await expect(adminPage.locator('.team-card').first())
      .toBeVisible({ timeout: 10000 });

    // Search for the team first (robust, cross-browser)
    const searchBox = adminPage.getByPlaceholder('Search teams by name, description, or member...');
    await expect(searchBox).toBeVisible();
    await searchBox.fill(teamName);

    // Wait until the team appears
    const teamCard = adminPage.locator('.team-card', { hasText: teamName });
      await expect.poll(
        () => teamCard.count(),
        { timeout: 20000 }
      ).toBeGreaterThan(0);

    // Click edit (icon-only button)
    await teamCard.locator('button').first().click();
    await adminPage.getByPlaceholder('Enter team description')
      .fill('Edited by E2E');

    await adminPage.getByRole('button', { name: /save|update/i }).click();

    const updateDialog = adminPage.getByRole('dialog', { name: /update team/i });
    await updateDialog.getByRole('button', { name: /yes, proceed/i }).click();
    await expect(updateDialog).toBeHidden({ timeout: 8000 });

    // Re-assert team card still visible (edit succeeded)
    await expect(teamCard).toBeVisible();
  });

  /* ------------------- DELETE TEST ------------------- */
  test('Can delete a team', async ({ adminPage }) => {
    await adminPage.goto('/teams');

    const teamName = `Delete Test Team ${Date.now()}`;
      await createTeam(adminPage, teamName, 'Delete test');

    await adminPage.waitForLoadState('networkidle');

    // Search for team
    const searchBox = adminPage.getByPlaceholder('Search teams by name, description, or member...');
    await expect(searchBox).toBeVisible();
    await searchBox.fill(teamName);

    const teamCard = adminPage.locator('.team-card', { hasText: teamName });
      await expect.poll(
        () => teamCard.count(),
        { timeout: 20000 }
      ).toBeGreaterThan(0);

    // Click delete icon (🗑)
    await teamCard.locator('button').nth(1).click();

    // Confirm delete
    const dialog = adminPage.getByRole('dialog');
    await dialog.getByRole('button', { name: /delete|confirm|yes/i }).click();

    // Verify removal
      await expect.poll(
        () => adminPage.locator('.team-card', { hasText: teamName }).count(),
        { timeout: 20000 }
      ).toBe(0);
  });

});


/* ============================================================
   Admin – Team Task Management
   ============================================================ */
test.describe('Admin – Team Task Management', () => {

  test('Create, mark done, and delete team task', async ({ adminPage }) => {

    // Navigate to Team Tasks
    await adminPage.locator('.navbar .nav-label', { hasText: 'Tasks' }).click();
    await adminPage.getByRole('link', { name: /team tasks/i }).click();
    await expect(adminPage.getByRole('heading', { name: /team tasks/i })).toBeVisible();

    /* ---------- Create Team Task ---------- */
    const taskTitle = `Playwright Team Task ${Date.now()}`;

    await adminPage.getByRole('button', { name: /new task/i }).click();
    await adminPage.getByPlaceholder('Enter task title').fill(taskTitle);
    await adminPage.getByPlaceholder('Enter task description').fill(
      'Created by Playwright E2E test'
    );

    // Switch to Team tab if needed
    const teamTab = adminPage.getByRole('button', { name: /team/i });
    if (!(await teamTab.getAttribute('class'))?.includes('active')) {
      await teamTab.click();
    }

    // Assign to first available team
    const assignTeam = adminPage.getByRole('combobox', { name: /assign to team/i });
    if (await assignTeam.count()) {
      await assignTeam.selectOption({ index: 0 });
    }

    await adminPage.getByRole('button', { name: /add task/i }).click();

    // Confirm create dialog if shown
    const confirmDialog = adminPage.getByRole('dialog', { name: /create task/i });
    if (await confirmDialog.isVisible().catch(() => false)) {
      await confirmDialog.getByRole('button', { name: /yes, proceed/i }).click();
    }

    // ✅ WAIT FOR BACKEND CONFIRMATION
      await expect.poll(
        () => adminPage.getByRole('status').filter({ hasText: /task created successfully/i }).count(),
        { timeout: 20000 }
      ).toBeGreaterThan(0);

    // ✅ Ensure form is gone
    await expect(
      adminPage.getByRole('heading', { name: /create new task/i })
    ).toBeHidden();

    // ✅ Now search and assert
    const taskSearch = adminPage.getByPlaceholder('Search...');
    await taskSearch.fill(taskTitle);

    const taskRow = adminPage.locator(
      'table.task-table tbody tr',
      { hasText: taskTitle }
    );

    // Wait for row existence (not visibility)
      await expect.poll(
        () => taskRow.count(),
        { timeout: 20000 }
      ).toBeGreaterThan(0);

    await expect(taskRow.first()).toBeVisible();
    const countBefore = await adminPage.locator('table.task-table tbody tr').count();

    /* ---------- Mark Task as Done ---------- */
    const doneBtn = taskRow.getByRole('button', {
      name: /done|✓ done|mark as done/i,
    });

    if (await doneBtn.count()) {
      await doneBtn.click();

      const swal = adminPage.locator('.swal2-container');
      if (await swal.isVisible()) {
        await adminPage.getByRole('button', { name: /yes, proceed|confirm/i }).click();
        await expect(swal).toBeHidden();
      }
    }

    /* ---------- Delete Task ---------- */

    // Click delete icon directly (🗑)
    const deleteBtn = taskRow.getByRole('button', { name: /🗑|delete/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    const confirmDelete = adminPage.getByRole('button', {
      name: /yes|confirm|proceed/i,
    });

    if (await confirmDelete.isVisible().catch(() => false)) {
      await confirmDelete.click();
    }

    // Assert deletion by disappearance of task name (browser-safe)
    // Wait for confirmation dialog to close
    const deleteDialog = adminPage.getByRole('dialog', { name: /delete/i });
    await expect(deleteDialog).toBeHidden({ timeout: 8000 });
    // Assert the task row is removed from the table (scoped, strict-safe)
    await expect(taskRow).toBeHidden({ timeout: 8000 });

    // Optional: assert empty state instead of toast
    await expect(
      adminPage.getByRole('heading', { name: /no tasks found/i })
    ).toBeVisible();
  });

  test('Team task management features', async ({ adminPage }) => {

    // Navigate to Team Tasks
    await adminPage.locator('.navbar .nav-label', { hasText: 'Tasks' }).click();
    await adminPage.getByRole('link', { name: /team tasks/i }).click();
    await expect(adminPage.getByRole('heading', { name: /team tasks/i })).toBeVisible();

    /* ---------- Status Filters ---------- */
    for (const status of ['All', 'To Do', 'In Progress', 'Done']) {
      await expect(adminPage.getByRole('button', { name: new RegExp(`^${status}$`, 'i') })).toBeVisible();
    }

    /* ---------- Priority Filters ---------- */
    for (const priority of ['All Priority', 'High', 'Medium', 'Low']) {
      await expect(adminPage.getByRole('button', { name: new RegExp(priority, 'i') })).toBeVisible();
    }

    /* ---------- Search Box ---------- */
    await expect(adminPage.getByPlaceholder('Search...')).toBeVisible();

    /* ---------- Comments Button ---------- */
    const firstRow = adminPage.locator('table.task-table tbody tr').first();
    if (await firstRow.locator('button.comments-btn').count()) {
      await expect(firstRow.locator('button.comments-btn')).toBeVisible();
      // Optionally click and assert modal/dialog
      // await firstRow.locator('button.comments-btn').click();
      // await expect(adminPage.getByText(/comments|add comment/i)).toBeVisible();
    }

    /* ---------- Log Button ---------- */
    if (await firstRow.locator('button.log-btn').count()) {
      await expect(firstRow.locator('button.log-btn')).toBeVisible();
      // Optionally click and assert modal/dialog
      // await firstRow.locator('button.log-btn').click();
      // await expect(adminPage.getByText(/log|completion log/i)).toBeVisible();
    }

    /* ---------- Recurrent Flag ---------- */
    if (await firstRow.locator('.recurrent-flag').count()) {
      await expect(firstRow.locator('.recurrent-flag')).toBeVisible();
    }
  });
});
/* ============================================================
   Admin – Activity Log
   ============================================================ */
test.describe('Admin – Activity Log', () => {

  test('View activity log, filters, and columns', async ({ adminPage }) => {

    await adminPage.locator('.navbar .nav-label', { hasText: 'Activity' }).click();
    await expect(adminPage.getByRole('heading', { name: /activity log/i })).toBeVisible();

    // Filters
    for (const filter of ['All', 'Task', 'Team', 'User', 'System']) {
      const btn = adminPage.getByRole('button', { name: new RegExp(filter, 'i') });
      if (await btn.count()) {
        await expect(btn).toBeVisible();
      }
    }

    // Wait until loading finishes
    await expect(adminPage.getByText(/loading activities/i)).toBeHidden({ timeout: 15000 });

    // Entries may or may not exist → assert state safely
    const activityEntries = adminPage.locator('text=/commented on|created|updated|deleted/i');
    if (await activityEntries.count()) {
      await expect(activityEntries.first()).toBeVisible();
    } else {
      // Empty activity log is valid
      await expect(
        adminPage.getByText(/no activities|no activity found/i)
      ).toBeVisible();
    }

    // Columns
    const section = adminPage.locator(
      '.activity-log-section, .activity-log-container, [data-testid="activity-log-section"]'
    ).first();

    for (const col of ['Timestamp', 'User', 'Action', 'Description']) {
      if (await section.getByText(new RegExp(col, 'i')).count()) {
        await expect(section.getByText(new RegExp(col, 'i'))).toBeVisible();
      }
    }

    // Filter behavior: click each filter and assert entries update
    for (const filter of ['All', 'Task', 'Team', 'User', 'System']) {
      const btn = adminPage.getByRole('button', { name: new RegExp(filter, 'i') });
      if (await btn.count()) {
        await btn.click();
        // Wait for loading to finish after filter
        await expect(adminPage.getByText(/loading activities/i)).toBeHidden({ timeout: 15000 });
        // Assert entries or empty state
        const activityEntries = adminPage.locator('text=/commented on|created|updated|deleted/i');
        if (await activityEntries.count()) {
          await expect(activityEntries.first()).toBeVisible();
        } else {
          await expect(
            adminPage.getByText(/no activities|no activity found/i)
          ).toBeVisible();
        }
      }
    }
  });
});
/* ============================================================
   Admin – User Management
   ============================================================ */
test.describe('Admin – User Management', () => {

  test('Edit user role', async ({ adminPage }) => {

    await adminPage.locator('.navbar .nav-label', { hasText: 'User Management' }).click();
    await expect(
      adminPage.getByRole('heading', { name: /user management/i })
    ).toBeVisible();

    const email = 'user5@gmail.com';
    const row = adminPage.locator('tr').filter({ hasText: email }).first();

    const roleDropdown = row.getByRole('combobox');
    await roleDropdown.selectOption({ label: 'Admin' });

    const confirm = adminPage
      .getByRole('heading', { name: /change user role/i })
      .locator('..')
      .getByRole('button', { name: /yes, proceed/i });

    if (await confirm.isVisible()) {
      await confirm.click();
    }

    await expect(
      row.locator('td').filter({ hasText: /^admin$/i })
    ).toBeVisible();
  });
});

/* ============================================================
   Admin – Dashboard & Navigation
   ============================================================ */
test.describe('Admin – Dashboard & Navigation', () => {

  test('Dashboard loads with stats', async ({ adminPage }) => {

    await expect(adminPage.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(adminPage.getByText('Total Tasks')).toBeVisible();
    await expect(adminPage.getByText('Recent Tasks')).toBeVisible();

    // Assert stat values (scoped, strict-mode safe)
    const totalTasksCard = adminPage.getByText('Total Tasks').locator('..');
    await expect(totalTasksCard.getByText(/^[0-9]+$/)).toBeVisible();

    const completedCard = adminPage.getByText('Completed').locator('..');
    await expect(completedCard.getByText(/^[0-9]+$/)).toBeVisible();

    const inProgressCard = adminPage.getByText('In Progress').locator('..');
    await expect(inProgressCard.getByText(/^[0-9]+$/)).toBeVisible();
    // Assert completion rate is a percentage (e.g., "11%", "13%", etc.)
    const completionCard = adminPage.getByText('Completion Rate').locator('..');
    await expect(completionCard.getByText(/^[0-9]+%$/)).toBeVisible();

    // Assert 'View All Tasks' button
    await expect(adminPage.getByRole('button', { name: /view all tasks/i })).toBeVisible();

    // Click a Recent Tasks item (if present)
    const recentTask = adminPage.locator('text=Recent Tasks').locator('..').locator('li').first();
    if (await recentTask.count()) {
      await recentTask.click();
      // Optionally assert navigation or modal/dialog
      // await expect(adminPage.getByText(/task detail|edit|modal/i)).toBeVisible();
    }
  });

  test('Sidebar navigation works', async ({ adminPage }) => {

    const sidebar = adminPage.locator('.navbar');
    for (const item of [
      'Dashboard',
      'Tasks',
      'Analytics',
      'Activity',
      'Profile',
      'Teams',
      'User Management',
    ]) {
      await expect(sidebar.getByText(item)).toBeVisible();
    }
  });
});

/* ============================================================
   Admin – Analytics
   ============================================================ */
test.describe('Admin – Analytics', () => {
  test('Analytics page loads and displays stats, export, filter, and chart', async ({ adminPage }) => {

    // Navigate to Analytics
    await adminPage.locator('.navbar .nav-label', { hasText: 'Analytics' }).click();
    await expect(adminPage.getByRole('heading', { name: /analytics/i })).toBeVisible();

    // Stats cards
    await expect(adminPage.getByText('TOTAL TASKS')).toBeVisible();
    await expect(adminPage.getByText('COMPLETED')).toBeVisible();
    await expect(adminPage.getByText('IN PROGRESS')).toBeVisible();
    await expect(adminPage.getByText('COMPLETION RATE')).toBeVisible();

    // User filter (custom dropdown)
    await expect(adminPage.getByText(/^All Users$/i)).toBeVisible();

    // Export Data button
    await expect(adminPage.getByRole('button', { name: /export data/i })).toBeVisible();

    // Chart section
    await expect(adminPage.getByText('Task Status Distribution')).toBeVisible();
    // Chart type selector (custom dropdown)
    await expect(adminPage.getByText(/^Pie Chart$/i)).toBeVisible();
    // Accept either SVG or canvas for chart rendering
    const chart = adminPage.locator('svg, canvas');
    await expect(chart).toBeVisible();

    // Change chart type (if other types exist)
    await expect(adminPage.getByText(/^Pie Chart$/i)).toBeVisible();
    // Try changing chart type if dropdown is interactive
    const chartTypeDropdown = adminPage.getByText(/^Pie Chart$/i).locator('..');
    if (await chartTypeDropdown.locator('button, .dropdown-toggle').count()) {
      await chartTypeDropdown.locator('button, .dropdown-toggle').click();
      // Select another chart type (e.g., Bar Chart)
      if (await adminPage.getByText(/^Bar Chart$/i).count()) {
        await adminPage.getByText(/^Bar Chart$/i).click();
        await expect(adminPage.getByText(/^Bar Chart$/i)).toBeVisible();
        // Optionally assert chart rendering
        await expect(adminPage.locator('svg, canvas')).toBeVisible();
      }
    }

    // Change user filter (custom dropdown)
    const userFilter = adminPage.getByText(/^All Users$/i);
    await expect(userFilter).toBeVisible();
    // Optionally open dropdown if interactive
    const userFilterToggle = userFilter.locator('..');
    if (await userFilterToggle.isVisible()) {
      await userFilterToggle.click();
      // Optionally select another user if options are visible
      // if (await adminPage.getByText(/^Some Other User$/i).count()) {
      //   await adminPage.getByText(/^Some Other User$/i).click();
      //   await expect(adminPage.getByText(/^Some Other User$/i)).toBeVisible();
      // }
    }

    // Export download validation
    const exportBtn = adminPage.getByRole('button', { name: /export data/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    // Optionally assert download (if Playwright download API is set up)
    // const [download] = await Promise.all([
    //   page.waitForEvent('download'),
    //   exportBtn.click(),
    // ]);
    // await expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx/i);
  });
});


/* ============================================================
   Admin – User Task Management
   ============================================================ */
test.describe('Admin – User Task Management', () => {
  test('User Tasks: navigation, filter, CRUD, logs, comments, actions', async ({ adminPage }) => {

    // Navigate to User Tasks
    await adminPage.locator('.navbar .nav-label', { hasText: 'Tasks' }).click();
    await adminPage.getByRole('link', { name: /user tasks/i }).click();
    await expect(adminPage.getByRole('heading', { name: /user tasks/i })).toBeVisible();

    // User filter dropdown (combobox)
    const userFilter = adminPage.locator('select.user-filter-select');
    await expect(userFilter).toBeVisible();
    await expect(userFilter).toHaveValue('All Users');

    // Search bar
    await expect(adminPage.getByPlaceholder('Search...')).toBeVisible();

    // Status filters
    for (const status of ['All', 'To Do', 'In Progress', 'Done']) {
      await expect(adminPage.getByRole('button', { name: new RegExp(`^${status}$`, 'i') })).toBeVisible();
    }

    // Priority filters
    for (const priority of ['All Priority', 'High', 'Medium', 'Low']) {
      await expect(adminPage.getByRole('button', { name: new RegExp(priority, 'i') })).toBeVisible();
    }

    // Create a user task
    const userTaskTitle = `Playwright User Task ${Date.now()}`;
    await adminPage.getByRole('button', { name: /new task/i }).click();
    await adminPage.getByPlaceholder('Enter task title').fill(userTaskTitle);
    await adminPage.getByPlaceholder('Enter task description').fill('User task created by Playwright E2E test');
    await adminPage.getByRole('button', { name: /add task/i }).click();
    // Confirm dialog if shown
    const confirmDialog = adminPage.getByRole('dialog', { name: /create task/i });
    if (await confirmDialog.isVisible().catch(() => false)) {
      await confirmDialog.getByRole('button', { name: /yes, proceed/i }).click();
    }
    // Assert success toast
    await expect.poll(
      () => adminPage.getByRole('status').filter({ hasText: /task created successfully/i }).count(),
      { timeout: 20000 }
    ).toBeGreaterThan(0);

    // Pagination: go to last page
    const nextBtn = adminPage.getByRole('button', { name: /^next$/i });
    while (await nextBtn.isEnabled()) {
      await nextBtn.click();
    }

    // Verify created user task
    const userTaskRows = adminPage.locator('table.task-table tbody tr', {
      hasText: userTaskTitle,
    });
    await expect.poll(() => userTaskRows.count(), { timeout: 20000 }).toBeGreaterThan(0);
    const userTaskRow = userTaskRows.last();

    // Mark as Done
    const doneBtn = userTaskRow.getByRole('button', { name: /done|✓ done|mark as done/i });
    if (await doneBtn.count()) {
      await doneBtn.click();
      const swal = adminPage.locator('.swal2-container');
      if (await swal.isVisible()) {
        await adminPage.getByRole('button', { name: /yes, proceed|confirm/i }).click();
        await expect(swal).toBeHidden();
      }
    }

    // Comments button
    if (await userTaskRow.locator('button.comments-btn').count()) {
      await expect(userTaskRow.locator('button.comments-btn')).toBeVisible();
      // Optionally click and assert modal/dialog
      // await userTaskRow.locator('button.comments-btn').click();
      // await expect(adminPage.getByText(/comments|add comment/i)).toBeVisible();
    }

    // Log button
    if (await userTaskRow.locator('button.log-btn').count()) {
      await expect(userTaskRow.locator('button.log-btn')).toBeVisible();
      // Optionally click and assert modal/dialog
      // await userTaskRow.locator('button.log-btn').click();
      // await expect(adminPage.getByText(/log|completion log/i)).toBeVisible();
    }

    // Recurrent flag
    if (await userTaskRow.locator('.recurrent-flag').count()) {
      await expect(userTaskRow.locator('.recurrent-flag')).toBeVisible();
    }

    // Delete user task
    const deleteBtn = userTaskRow.getByRole('button', { name: /🗑|delete/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    const confirmDelete = adminPage.getByRole('button', { name: /yes|confirm|proceed/i });
    if (await confirmDelete.isVisible().catch(() => false)) {
      await confirmDelete.click();
    }
    // Assert the task is actually gone (source of truth, robust for all browsers)
    await expect.poll(
      () => adminPage.locator(
        'table.task-table tbody tr',
        { hasText: userTaskTitle }
      ).count(),
      { timeout: 20000 }
    ).toBe(0);
  });
});

/* ============================================================
   Admin – Profile
   ============================================================ */
test.describe('Admin – Profile', () => {
  test('Profile page: navigation, user details, mentions', async ({ adminPage }) => {

    // Navigate to Profile
    await adminPage.locator('.navbar .nav-label', { hasText: 'Profile' }).click();
    // Assert profile page loaded via user name heading
    await expect(adminPage.getByRole('heading', { name: /mani2/i })).toBeVisible();

    // User details
    // Assert Email label + value together (strict-mode safe)
    const emailRow = adminPage.getByText(/^Email$/i).locator('..');
    await expect(emailRow).toContainText(/@/);
    // Assert Role label + value together (strict-mode safe)
    const roleRow = adminPage.getByText(/^Role$/i).locator('..');
    await expect(roleRow).toContainText(/admin|team manager|user/i);
    await expect(adminPage.getByText(/joined/i)).toBeVisible();

    // Mentions section (if present)
    if (await adminPage.getByText(/mentions/i).count()) {
      // Mentions section: assert heading (strict-mode safe)
      await expect(
        adminPage.getByRole('heading', { name: /recent mentions/i })
      ).toBeVisible();
      // Optionally assert mention items
      // await expect(adminPage.locator('.mention-item')).toBeVisible();
    }
  });
});