import { useState, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
}

const OptimizedImage = ({
  src,
  alt,
  className = "",
  width,
  height,
  quality = 75,
  priority = false,
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(priority ? src : null);
  const [isLoading, setIsLoading] = useState(!priority);

  useEffect(() => {
    if (priority) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
    };
    img.src = src;
  }, [src, priority]);

  // Generate optimized URL if using Supabase Storage
  const getOptimizedUrl = (url: string) => {
    if (url.includes("supabase") && width && height) {
      return `${url}?width=${width}&height=${height}&quality=${quality}`;
    }
    return url;
  };

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
      )}
      {imageSrc && (
        <img
          src={getOptimizedUrl(imageSrc)}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          loading={priority ? "eager" : "lazy"}
          width={width}
          height={height}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
