export type ProductCondition =
  | 'new'
  | 'nos'
  | 'used_good'
  | 'used_fair'
  | 'needs_rebuild'
  | 'parts_only'

export const conditionLabel: Record<ProductCondition, string> = {
  new:           'New',
  nos:           'NOS (New Old Stock)',
  used_good:     'Used — good',
  used_fair:     'Used — fair',
  needs_rebuild: 'Needs rebuild',
  parts_only:    'Parts only',
}

export const productConditionOptions: { value: ProductCondition; label: string }[] = [
  { value: 'new',           label: 'New' },
  { value: 'nos',           label: 'NOS (New Old Stock)' },
  { value: 'used_good',     label: 'Used — good' },
  { value: 'used_fair',     label: 'Used — fair' },
  { value: 'needs_rebuild', label: 'Needs rebuild' },
  { value: 'parts_only',    label: 'Parts only' },
]
