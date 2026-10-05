/**
 * Handles image loading errors by replacing the source with a default SVG placeholder.
 * @param event The error event from the <img> tag
 * @param type Optional type to customize the placeholder (e.g., 'profile', 'thumbnail')
 */
export const handleImageError = (event: Event, type: 'profile' | 'thumbnail' = 'thumbnail') => {
  const target = event.target as HTMLImageElement;
  if (!target) return;

  // Prevent infinite loop if the fallback itself fails
  if (target.dataset.fallbackApplied === 'true') return;
  target.dataset.fallbackApplied = 'true';

  let svg = '';

  if (type === 'profile') {
    // A simple user icon SVG for profile pictures
    svg = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#E5E7EB"/>
      <circle cx="50" cy="40" r="20" fill="#9CA3AF"/>
      <path d="M20 85C20 70 30 60 50 60C70 60 80 70 80 85" stroke="#9CA3AF" stroke-width="8" stroke-linecap="round"/>
    </svg>`;
  } else {
    // A more travel/nature themed SVG for trip thumbnails
    svg = `<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#F3F4F6"/>
      <path d="M0 300L150 100L250 220L320 160L400 260V300H0Z" fill="#D1D5DB"/>
      <circle cx="320" cy="70" r="30" fill="#FDE047" opacity="0.6"/>
      <rect x="140" y="130" width="120" height="40" rx="20" fill="white" opacity="0.4"/>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="#6B7280">No Image Found</text>
    </svg>`;
  }

  const encodedSvg = btoa(unescape(encodeURIComponent(svg)));
  target.src = `data:image/svg+xml;base64,${encodedSvg}`;
};
