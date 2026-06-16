import { z } from 'zod'

const ConfidenceLevel = z.enum(['high', 'medium', 'low'])

export const VisionResultSchema = z.object({
  suggested_title:           z.string().nullable(),
  suggested_part_number:     z.string().nullable(),
  suggested_vendor:          z.string().nullable(),
  suggested_category_hint:   z.string().nullable(),
  suggested_product_type:    z.string().nullable(),
  suggested_condition_notes: z.string().nullable(),
  suggested_summary:         z.string().nullable(),
  confidence:                z.record(z.string(), ConfidenceLevel).optional().default({}),
})

export type VisionResult = z.infer<typeof VisionResultSchema>
