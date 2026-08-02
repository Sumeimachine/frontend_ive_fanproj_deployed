import type { CSSProperties, ImgHTMLAttributes } from "react";

type ResponsiveMemberImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  pictureClassName?: string;
  pictureStyle?: CSSProperties;
};

const bundledMemberPattern = /^\/images\/members\/([^/?#]+)\.(?:jpe?g|png)$/i;

const getBundledMemberName = (url: string) => bundledMemberPattern.exec(url)?.[1];

export const getOptimizedMemberImageUrl = (url: string, width = 960) => {
  const memberName = getBundledMemberName(url);
  return memberName ? `/images/members/optimized/${memberName}-${width}.webp` : url;
};

export default function ResponsiveMemberImage({
  src = "",
  alt = "",
  pictureClassName,
  pictureStyle,
  ...imageProps
}: ResponsiveMemberImageProps) {
  const memberName = getBundledMemberName(src);

  if (!memberName) {
    return <img src={src} alt={alt} loading="lazy" decoding="async" {...imageProps} />;
  }

  return (
    <picture className={pictureClassName} style={pictureStyle}>
      <source
        type="image/avif"
        srcSet={`/images/members/optimized/${memberName}-480.avif 480w, /images/members/optimized/${memberName}-960.avif 960w`}
        sizes={imageProps.sizes}
      />
      <source
        type="image/webp"
        srcSet={`/images/members/optimized/${memberName}-480.webp 480w, /images/members/optimized/${memberName}-960.webp 960w`}
        sizes={imageProps.sizes}
      />
      <img src={src} alt={alt} loading="lazy" decoding="async" {...imageProps} />
    </picture>
  );
}
