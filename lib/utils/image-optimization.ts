// lib/utils/image-optimization.ts

/**
 * Generate optimized image URL with Next.js Image optimization
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  quality: number = 75
): string {
  if (!src) return "";

  // If it's an external URL, use Next.js image optimization
  if (src.startsWith("http")) {
    return `/_next/image?url=${encodeURIComponent(
      src
    )}&w=${width}&q=${quality}`;
  }

  return src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(src: string, sizes: number[]): string {
  return sizes
    .map((size) => `${getOptimizedImageUrl(src, size)} ${size}w`)
    .join(", ");
}

/**
 * Get blur data URL for placeholder
 */
export function getBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
    </svg>
  `;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Progressive image loading component helper
 */
export const imageLoadingStates = {
  loading: "blur",
  error: "empty",
  loaded: "normal",
} as const;

/**
 * Image size presets for common use cases
 */
export const imageSizes = {
  thumbnail: 100,
  small: 300,
  medium: 600,
  large: 1200,
  xlarge: 1920,
} as const;

/**
 * Quality presets
 */
export const imageQuality = {
  low: 50,
  medium: 75,
  high: 90,
} as const;

/**
 * Lazy load configuration
 */
export const lazyLoadConfig = {
  rootMargin: "50px",
  threshold: 0.01,
};

/**
 * Check if image should be lazy loaded
 */
export function shouldLazyLoad(index: number, totalImages: number): boolean {
  // Load first 3 images immediately, lazy load rest
  return index > 2;
}

/**
 * Get responsive image sizes attribute
 */
export function getResponsiveSizes(type: "card" | "hero" | "avatar"): string {
  const sizeMap = {
    card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    hero: "100vw",
    avatar: "(max-width: 640px) 48px, 64px",
  };

  return sizeMap[type];
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: "high" | "low" = "high") {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  link.fetchPriority = priority;

  document.head.appendChild(link);
}

/**
 * Compress image client-side (for uploads)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
