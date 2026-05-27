import { expect, test } from '@playwright/test'

test.describe('user section smoke', () => {
  test('/login renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('/register renders all required fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
    for (const label of ['Full name', 'Email', 'Phone', 'Password']) {
      await expect(page.getByLabel(label)).toBeVisible()
    }
  })

  test('/forgot-password submit shows the no-enumeration success banner', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill('nobody-xyz@example.com')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText(/if an account exists for that address/i)).toBeVisible({
      timeout: 30_000,
    })
  })

  test('/account redirects to /login when not signed in', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
  })

  test('register → verify-pending', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel('Full name').fill('E2E User')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Phone').fill('+420 777 100 200')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/verify-email\/pending/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible({
      timeout: 30_000,
    })
  })
})
