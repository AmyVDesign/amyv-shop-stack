import { describe, it, expect } from 'vitest'
import { VisionResultSchema } from '@/lib/vision-schema'

const VALID_PAYLOAD = {
  suggested_title:           'Onan Marine Generator Carburetor',
  suggested_part_number:     '147-0831',
  suggested_vendor:          'Onan',
  suggested_category_hint:   'Marine Engine Parts',
  suggested_product_type:    'Engine Parts',
  suggested_condition_notes: null,
  suggested_summary:         'Carburetor for select Onan marine generator models.',
  confidence: {
    title:        'high',
    part_number:  'high',
    vendor:       'medium',
    category:     'medium',
    product_type: 'low',
    condition_notes: 'low',
    summary:      'medium',
  },
}

describe('VisionResultSchema', () => {
  it('parses a valid vision model payload', () => {
    const result = VisionResultSchema.safeParse(VALID_PAYLOAD)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.suggested_title).toBe('Onan Marine Generator Carburetor')
      expect(result.data.suggested_part_number).toBe('147-0831')
      expect(result.data.confidence.title).toBe('high')
    }
  })

  it('parses a payload with all nullable fields set to null', () => {
    const payload = {
      suggested_title:           null,
      suggested_part_number:     null,
      suggested_vendor:          null,
      suggested_category_hint:   null,
      suggested_product_type:    null,
      suggested_condition_notes: null,
      suggested_summary:         null,
      confidence:                {},
    }
    const result = VisionResultSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('defaults confidence to empty object when omitted', () => {
    const payload = {
      suggested_title:           'Test',
      suggested_part_number:     null,
      suggested_vendor:          null,
      suggested_category_hint:   null,
      suggested_product_type:    null,
      suggested_condition_notes: null,
      suggested_summary:         null,
    }
    const result = VisionResultSchema.safeParse(payload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.confidence).toEqual({})
    }
  })

  it('rejects a payload missing required fields', () => {
    const result = VisionResultSchema.safeParse({ suggested_title: 'test' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })

  it('rejects a payload with an invalid confidence level', () => {
    const payload = {
      ...VALID_PAYLOAD,
      confidence: { title: 'unknown_level' },
    }
    const result = VisionResultSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })

  it('rejects a payload where a string field is not a string or null', () => {
    const payload = { ...VALID_PAYLOAD, suggested_title: 42 }
    const result = VisionResultSchema.safeParse(payload)
    expect(result.success).toBe(false)
  })
})
