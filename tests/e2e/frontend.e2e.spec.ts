import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('homepage renders shorten form', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page.locator('h1').first()).toHaveText('link.cny.sh')
    await expect(page.locator('input[name="targetUrl"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /shorten/i })).toBeVisible()
  })
})
