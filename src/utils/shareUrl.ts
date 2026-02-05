interface ShareParams {
  x: number;
  y: number;
  zoom: number;
  marker?: string;
}

/**
 * Generates a shareable URL with the current map view
 */
export function generateShareUrl(params: ShareParams): string {
  const url = new URL(window.location.href);

  // Clear existing params
  url.search = '';

  // Add view parameters
  url.searchParams.set('x', Math.round(params.x).toString());
  url.searchParams.set('y', Math.round(params.y).toString());
  url.searchParams.set('z', params.zoom.toFixed(1));

  if (params.marker) {
    url.searchParams.set('marker', params.marker);
  }

  return url.toString();
}

/**
 * Parses share parameters from the current URL
 */
export function parseShareUrl(): ShareParams | null {
  const params = new URLSearchParams(window.location.search);

  const x = params.get('x');
  const y = params.get('y');
  const zoom = params.get('z');

  // Need at least x, y, and zoom
  if (!x || !y || !zoom) {
    return null;
  }

  const parsed: ShareParams = {
    x: parseFloat(x),
    y: parseFloat(y),
    zoom: parseFloat(zoom),
  };

  // Validate parsed values
  if (isNaN(parsed.x) || isNaN(parsed.y) || isNaN(parsed.zoom)) {
    return null;
  }

  // Validate ranges
  if (parsed.x < 0 || parsed.x > 20000 || parsed.y < 0 || parsed.y > 20000) {
    return null;
  }

  if (parsed.zoom < -5 || parsed.zoom > 5) {
    return null;
  }

  const marker = params.get('marker');
  if (marker) {
    parsed.marker = marker;
  }

  return parsed;
}

/**
 * Copies text to clipboard and returns success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}
