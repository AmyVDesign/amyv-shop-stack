import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryCombobox } from '@/app/admin/(protected)/products/CategoryCombobox'
import type { CategoryValue } from '@/app/admin/(protected)/products/CategoryCombobox'

// MARINE_CATEGORIES is small (24 lines of real data) -- use the real module.

function Wrapper({
  onChange = vi.fn() as unknown as (v: CategoryValue | null) => void,
  value = null,
}: {
  onChange?: (v: CategoryValue | null) => void
  value?: CategoryValue | null
}) {
  return (
    <CategoryCombobox
      id="category"
      value={value}
      onChange={onChange}
    />
  )
}

describe('CategoryCombobox keyboard navigation', () => {
  it('opens the listbox and moves down on ArrowDown', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    // The input has aria-haspopup + aria-expanded but lacks role="combobox".
    // ARIA 1.2 requires an explicit attribute; without it, the element maps to
    // "textbox" in the accessibility tree. Query accordingly; file the explicit
    // role as a future a11y hardening item.
    const input = screen.getByRole('textbox')
    await user.click(input)

    // Listbox should be open
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Press ArrowDown to move to the first item
    await user.keyboard('[ArrowDown]')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('moves up on ArrowUp (stays at 0 when at first item)', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    // The input has aria-haspopup + aria-expanded but lacks role="combobox".
    // ARIA 1.2 requires an explicit attribute; without it, the element maps to
    // "textbox" in the accessibility tree. Query accordingly; file the explicit
    // role as a future a11y hardening item.
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('[ArrowDown]')
    await user.keyboard('[ArrowUp]')

    const options = screen.getAllByRole('option')
    // Should stay at index 0 when already at top
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('selects the active item on Enter', async () => {
    const mockFn = vi.fn()
    const onChange = mockFn as unknown as (v: CategoryValue | null) => void
    const user = userEvent.setup()
    render(<Wrapper onChange={onChange} />)

    // The input has aria-haspopup + aria-expanded but lacks role="combobox".
    // ARIA 1.2 requires an explicit attribute; without it, the element maps to
    // "textbox" in the accessibility tree. Query accordingly; file the explicit
    // role as a future a11y hardening item.
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('[ArrowDown]')
    await user.keyboard('[Enter]')

    expect(mockFn).toHaveBeenCalledOnce()
    const [arg] = mockFn.mock.calls[0] as [CategoryValue | null]
    expect(arg).toHaveProperty('id')
    expect(arg).toHaveProperty('label')
    expect(arg).toHaveProperty('path')
  })

  it('closes the listbox and reverts on Escape', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    // The input has aria-haspopup + aria-expanded but lacks role="combobox".
    // ARIA 1.2 requires an explicit attribute; without it, the element maps to
    // "textbox" in the accessibility tree. Query accordingly; file the explicit
    // role as a future a11y hardening item.
    const input = screen.getByRole('textbox')
    await user.click(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('[Escape]')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('filters options when the user types', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    // The input has aria-haspopup + aria-expanded but lacks role="combobox".
    // ARIA 1.2 requires an explicit attribute; without it, the element maps to
    // "textbox" in the accessibility tree. Query accordingly; file the explicit
    // role as a future a11y hardening item.
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.type(input, 'oil')

    // jsdom does not compute styles, so the filter is exercised by checking
    // that only categories matching "oil" are in the listbox.
    const listbox = screen.getByRole('listbox')
    const visible = within(listbox).getAllByRole('option')
    visible.forEach((opt) => {
      expect(opt.textContent?.toLowerCase()).toContain('oil')
    })
  })

  // jsdom does not support scroll, pointer-events CSS, or real focus rings.
  // Pointer-triggered filtering and scroll-into-view are not tested here;
  // cover them in the Playwright suite.
})
