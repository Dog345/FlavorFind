// Generate a deterministic placeholder SVG based on recipe title
export function generatePlaceholderImage(title: string): string {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ee5a6f',
    '#f368e0', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'
  ];
  
  // Use title hash to pick color consistently
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }
  
  const color = colors[Math.abs(hash) % colors.length];
  const emoji = ['🍝', '🍔', '🍜', '🍱', '🥗', '🍲', '🥘', '🍛', '🌮', '🍕'][Math.abs(hash) % 10];
  
  const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='${encodeURIComponent(color)}' width='400' height='300'/%3E%3Ctext x='50%25' y='40%25' font-size='80' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${emoji}%3C/text%3E%3Ctext x='50%25' y='75%25' font-size='16' fill='white' text-anchor='middle' dominant-baseline='middle' font-weight='bold'%3E${encodeURIComponent(title.substring(0, 30))}%3C/text%3E%3C/svg%3E`;
  
  return svg;
}

// List of food image URLs that work reliably
export const RELIABLE_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
];

export function getRandomFallbackImage(): string {
  return RELIABLE_FOOD_IMAGES[Math.floor(Math.random() * RELIABLE_FOOD_IMAGES.length)];
}
