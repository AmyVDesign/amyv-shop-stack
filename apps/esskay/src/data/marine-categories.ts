export type MarineCategory = {
  label: string
  google_category_id: string
  google_category_path: string
}

export const MARINE_CATEGORIES: MarineCategory[] = [
  // Marine parts (all map to Watercraft Parts & Accessories)
  { label: 'Marine Oil Filters',          google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Fuel Filters',         google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Impellers',            google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Pumps',                google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Switches',             google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Gaskets & O-Rings',    google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Starters',             google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Electrical Components',google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Engine Parts',         google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Hardware',             google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  { label: 'Marine Other',                google_category_id: '888', google_category_path: 'Vehicles & Parts > Vehicle Parts & Accessories > Watercraft Parts & Accessories' },
  // Books and charts
  { label: 'Nautical Books',              google_category_id: '783', google_category_path: 'Media > Books' },
  { label: 'Cruising Guides',             google_category_id: '783', google_category_path: 'Media > Books' },
  { label: 'Charts & Navigational Aids',  google_category_id: '783', google_category_path: 'Media > Books' },
]
