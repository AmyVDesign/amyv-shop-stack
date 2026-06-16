import '@testing-library/jest-dom/vitest'
import 'vitest-axe/extend-expect'
import * as axeMatchers from 'vitest-axe/matchers'
import { expect, vi } from 'vitest'

expect.extend(axeMatchers)

// jsdom does not implement scrollIntoView; stub it so components that call it don't throw.
window.HTMLElement.prototype.scrollIntoView = vi.fn()
