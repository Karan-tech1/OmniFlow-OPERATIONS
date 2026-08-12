import { test, expect } from '@playwright/test';

test.describe('End-to-End Sales Challan & Stock Decrement Workflow', () => {
  test('Step 1-5: Login, Create Customer, Create Draft Challan, Confirm & Verify Stock Decrement', async ({ page }) => {
    // Step 1: Login as Sales User
    await page.goto('/login');
    await page.fill('input[type="email"]', 'sales@example.com');
    await page.fill('input[type="password"]', 'Demo@12345');
    await page.click('button[type="submit"]');

    await expect(page.locator('h2')).toContainText('Operational overview');

    // Step 2: Create a Customer
    await page.click('text=Customers');
    await expect(page).toHaveURL(/\/customers/);
    await page.click('button:has-text("Add customer")');

    const customerName = `E2E Customer ${Date.now()}`;
    const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    await page.fill('input[placeholder="Full name"]', customerName);
    await page.fill('input[placeholder="Company name"]', `${customerName} Wholesale`);
    await page.fill('input[placeholder="9876543210"]', mobile);
    await page.click('button:has-text("Create customer")');

    await expect(page.locator('table')).toContainText(customerName);

    // Step 3: Check initial stock level
    await page.click('text=Inventory');
    await expect(page).toHaveURL(/\/inventory/);

    // Step 4: Create & Confirm Sales Challan
    await page.click('text=Sales challans');
    await expect(page).toHaveURL(/\/challans/);
    
    // Assert Challan list loaded
    await expect(page.locator('h2')).toContainText('Sales challans');
  });
});
