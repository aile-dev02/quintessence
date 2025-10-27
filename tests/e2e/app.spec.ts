import { test, expect } from '@playwright/test'

test.describe('TestMemo Application', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the application
    await page.goto('/')
    
    // Clear local storage for clean state
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display application title and main navigation', async ({ page }) => {
    // Check if the application loads properly
    await expect(page).toHaveTitle(/TestMemo/i)
    
    // Check main navigation elements
    await expect(page.getByText('TestMemo')).toBeVisible()
    await expect(page.getByText('新しいメモ')).toBeVisible()
  })

  test('should create a new memo', async ({ page }) => {
    // Click new memo button
    await page.getByText('新しいメモ').click()
    
    // Fill in the form
    await page.fill('[name="title"]', 'Test Memo Title')
    await page.fill('[name="body"]', 'This is a test memo content.')
    
    // Add a tag
    await page.fill('[placeholder*="タグ"]', 'test')
    await page.keyboard.press('Enter')
    
    // Save the memo
    await page.getByText('保存').click()
    
    // Check if memo was created and we're back to the list
    await expect(page.getByText('Test Memo Title')).toBeVisible()
    await expect(page.getByText('This is a test memo content.')).toBeVisible()
  })

  test('should edit an existing memo', async ({ page }) => {
    // First create a memo
    await page.getByText('新しいメモ').click()
    await page.fill('[name="title"]', 'Original Title')
    await page.fill('[name="body"]', 'Original content')
    await page.getByText('保存').click()
    
    // Find and edit the memo
    await page.getByText('Original Title').click()
    await page.getByText('編集').click()
    
    // Update the content
    await page.fill('[name="title"]', 'Updated Title')
    await page.fill('[name="body"]', 'Updated content')
    
    // Save changes
    await page.getByText('更新').click()
    
    // Verify changes
    await expect(page.getByText('Updated Title')).toBeVisible()
    await expect(page.getByText('Updated content')).toBeVisible()
  })

  test('should search for memos', async ({ page }) => {
    // Create a few memos first
    const memos = [
      { title: 'JavaScript Notes', body: 'Learning React and Vue' },
      { title: 'Python Tutorial', body: 'Django framework basics' },
      { title: 'Design Patterns', body: 'Observer and Factory patterns' }
    ]
    
    for (const memo of memos) {
      await page.getByText('新しいメモ').click()
      await page.fill('[name="title"]', memo.title)
      await page.fill('[name="body"]', memo.body)
      await page.getByText('保存').click()
    }
    
    // Search for JavaScript
    await page.fill('[placeholder*="検索"]', 'JavaScript')
    
    // Should show only JavaScript notes
    await expect(page.getByText('JavaScript Notes')).toBeVisible()
    await expect(page.getByText('Python Tutorial')).not.toBeVisible()
  })

  test('should filter memos by status', async ({ page }) => {
    // Create memos with different statuses
    await page.getByText('新しいメモ').click()
    await page.fill('[name="title"]', 'Draft Memo')
    await page.fill('[name="body"]', 'This is a draft')
    await page.getByText('保存').click()
    
    await page.getByText('新しいメモ').click()
    await page.fill('[name="title"]', 'Published Memo')
    await page.fill('[name="body"]', 'This is published')
    await page.selectOption('[name="status"]', 'published')
    await page.getByText('保存').click()
    
    // Filter by draft status
    await page.selectOption('[name="statusFilter"]', 'draft')
    
    await expect(page.getByText('Draft Memo')).toBeVisible()
    await expect(page.getByText('Published Memo')).not.toBeVisible()
    
    // Filter by published status
    await page.selectOption('[name="statusFilter"]', 'published')
    
    await expect(page.getByText('Published Memo')).toBeVisible()
    await expect(page.getByText('Draft Memo')).not.toBeVisible()
  })

  test('should delete a memo', async ({ page }) => {
    // Create a memo to delete
    await page.getByText('新しいメモ').click()
    await page.fill('[name="title"]', 'Memo to Delete')
    await page.fill('[name="body"]', 'This memo will be deleted')
    await page.getByText('保存').click()
    
    // View the memo detail
    await page.getByText('Memo to Delete').click()
    
    // Delete the memo
    await page.getByText('削除').click()
    
    // Confirm deletion in dialog
    await page.getByText('削除する').click()
    
    // Verify memo is gone
    await expect(page.getByText('Memo to Delete')).not.toBeVisible()
  })

  test('should manage tags', async ({ page }) => {
    // Create memo with tags
    await page.getByText('新しいメモ').click()
    await page.fill('[name="title"]', 'Tagged Memo')
    await page.fill('[name="body"]', 'This memo has tags')
    
    // Add multiple tags
    const tags = ['javascript', 'react', 'frontend']
    for (const tag of tags) {
      await page.fill('[placeholder*="タグ"]', tag)
      await page.keyboard.press('Enter')
    }
    
    await page.getByText('保存').click()
    
    // Verify tags are displayed
    for (const tag of tags) {
      await expect(page.getByText(tag)).toBeVisible()
    }
    
    // Filter by tag
    await page.getByText('javascript').first().click()
    await expect(page.getByText('Tagged Memo')).toBeVisible()
  })

  test('should show statistics dashboard', async ({ page }) => {
    // Create various memos for statistics
    const testMemos = [
      { title: 'Draft 1', status: 'draft' },
      { title: 'Draft 2', status: 'draft' },
      { title: 'Published 1', status: 'published' },
      { title: 'Archived 1', status: 'archived' }
    ]
    
    for (const memo of testMemos) {
      await page.getByText('新しいメモ').click()
      await page.fill('[name="title"]', memo.title)
      await page.fill('[name="body"]', `Content for ${memo.title}`)
      if (memo.status !== 'draft') {
        await page.selectOption('[name="status"]', memo.status)
      }
      await page.getByText('保存').click()
    }
    
    // Go to statistics view
    await page.getByText('統計').click()
    
    // Check statistics are displayed
    await expect(page.getByText('総メモ数: 4')).toBeVisible()
    await expect(page.getByText('下書き: 2')).toBeVisible()
    await expect(page.getByText('公開済み: 1')).toBeVisible()
    await expect(page.getByText('アーカイブ: 1')).toBeVisible()
  })

  test('should support bulk operations', async ({ page }) => {
    // Create multiple memos
    const memos = ['Memo 1', 'Memo 2', 'Memo 3']
    
    for (const title of memos) {
      await page.getByText('新しいメモ').click()
      await page.fill('[name="title"]', title)
      await page.fill('[name="body"]', `Content for ${title}`)
      await page.getByText('保存').click()
    }
    
    // Select multiple memos
    await page.check('[data-testid="memo-checkbox-1"]')
    await page.check('[data-testid="memo-checkbox-2"]')
    
    // Use bulk actions
    await page.getByText('一括操作').click()
    await page.getByText('公開する').click()
    
    // Verify memos were published
    await expect(page.getByText('公開済み').first()).toBeVisible()
  })
})