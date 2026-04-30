export const CATEGORIES = [
  {
    label: 'Fruits & Spreads',
    items: ['Blueberry F.', 'Strawberry F.', 'Blueberry J.', 'Strawberry J.', 'Nutella'],
  },
  {
    label: 'Vegetables',
    items: ['Jalapeño', 'Cucumber', 'Cherry Tomato', 'Arugula', 'Yellow chili peppers'],
  },
  {
    label: 'Leafy & Eggs',
    items: ['Purple cabbage', 'Green cabbage', 'Lettuce', 'Eggs'],
  },
  {
    label: 'Other Ingredients',
    items: ['Gyoza'],
  },
  {
    label: 'Cheese',
    items: ['Mozzarella', 'Parmesan', 'American'],
  },
  {
    label: 'Containers',
    items: ['Brown box', 'Yellow box', 'Tteok-bokki box', 'Red plate', 'Salad box', 'Rolls box'],
  },
  {
    label: 'Bags',
    items: ['Small clear bag', 'Large clear bag', 'Trash bag'],
  },
]

export const ALL_ITEMS = CATEGORIES.flatMap(cat =>
  cat.items.map(name => ({ name, category: cat.label }))
)

// Add or remove employees here
export const EMPLOYEES = [
  'Alex',
  'Maria',
  'Carlos',
  'Sofia',
  'James',
]
