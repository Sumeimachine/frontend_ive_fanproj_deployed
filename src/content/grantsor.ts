export interface FanPhotoEntry {
  id: string;
  title: string;
  alt: string;
  context: string;
  members: string[];
  postUrl: string;
  /** Base path: append -480.webp, -960.webp, or -1600.webp. */
  src: string;
  /** Dimensions of the original photograph, preserving its aspect ratio. */
  width: number;
  height: number;
  sourceUrl: string;
  publishedAt: string;
  eventDate: string;
}

export const photographer = {
  name: "GrantSor",
  profileUrl: "https://x.com/GrantSor",
};

// Permission was confirmed by the project owner on September 12, 2026.
// Original post authorship and media were verified against X's public
// syndication timeline. The event date differs from each post's publication date.
// These full-frame derivatives retain the photographer's existing watermark.
// See public/images/grantsor/CREDITS.md for provenance and reuse scope.
const context = "IVE Switch Manila Fansign";
const eventDate = "2024-07-12";

export const heroPhoto: FanPhotoEntry = {
  id: "yujin-gaeul-roses",
  title: "A moment between roses",
  alt: "Yujin and Gaeul posing back to back with red roses at the IVE Switch Manila fansign.",
  context,
  members: ["Yujin", "Gaeul"],
  postUrl: "https://x.com/GrantSor/status/1834259193140052360",
  src: "/images/grantsor/yujin-gaeul-roses",
  width: 4096,
  height: 2731,
  sourceUrl: "https://pbs.twimg.com/media/GXSYFuZawAAOivR?format=jpg&name=orig",
  publishedAt: "2024-09-12T15:54:05Z",
  eventDate,
};

export const fanPhotos: FanPhotoEntry[] = [
  {
    id: "yujin-peace",
    title: "A little hello from Yujin",
    alt: "Yujin holding up a peace sign in a white jacket at the IVE Switch Manila fansign.",
    context,
    members: ["Yujin"],
    postUrl: "https://x.com/GrantSor/status/1812915914389782753",
    src: "/images/grantsor/yujin-peace",
    width: 2731,
    height: 4096,
    sourceUrl:
      "https://pbs.twimg.com/media/GSjE0xRbIAIhQ_N?format=jpg&name=orig",
    publishedAt: "2024-07-15T18:23:30Z",
    eventDate,
  },
  {
    id: "gaeul-heart",
    title: "Gaeul, with love",
    alt: "Gaeul making half a heart beside her cheek at the IVE Switch Manila fansign.",
    context,
    members: ["Gaeul"],
    postUrl: "https://x.com/GrantSor/status/1813755569389367604",
    src: "/images/grantsor/gaeul-heart",
    width: 2731,
    height: 4096,
    sourceUrl:
      "https://pbs.twimg.com/media/GStX13bboAA1HZx?format=jpg&name=orig",
    publishedAt: "2024-07-18T02:00:00Z",
    eventDate,
  },
  {
    id: "rei-peace",
    title: "Double peace with Rei",
    alt: "Rei posing with two peace signs beside her face at the IVE Switch Manila fansign.",
    context,
    members: ["Rei"],
    postUrl: "https://x.com/GrantSor/status/1817003216644767860",
    src: "/images/grantsor/rei-peace",
    width: 2730,
    height: 4096,
    sourceUrl:
      "https://pbs.twimg.com/media/GTdKtYbaMAAcw1J?format=jpg&name=orig",
    publishedAt: "2024-07-27T01:04:59Z",
    eventDate,
  },
  {
    id: "wonyoung-flower-crown",
    title: "Wonyoung in bloom",
    alt: "Wonyoung wearing a red flower crown at the IVE Switch Manila fansign.",
    context,
    members: ["Wonyoung"],
    postUrl: "https://x.com/GrantSor/status/1813008144957907421",
    src: "/images/grantsor/wonyoung-flower-crown",
    width: 2730,
    height: 4096,
    sourceUrl:
      "https://pbs.twimg.com/media/GSjhDmlacAE4L5G?format=jpg&name=orig",
    publishedAt: "2024-07-16T00:30:00Z",
    eventDate,
  },
  {
    id: "liz-peace",
    title: "A little peace from Liz",
    alt: "Liz holding a peace sign beside her face at the IVE Switch Manila fansign.",
    context,
    members: ["Liz"],
    postUrl: "https://x.com/GrantSor/status/1815680808767865156",
    src: "/images/grantsor/liz-peace",
    width: 2731,
    height: 4096,
    sourceUrl:
      "https://pbs.twimg.com/media/GTKX-mEbkAAcPDA?format=jpg&name=orig",
    publishedAt: "2024-07-23T09:30:13Z",
    eventDate,
  },
  {
    id: "leeseo-tiger",
    title: "Leeseo’s tiger moment",
    alt: "Leeseo wearing a tiger-ear headband and playfully raising both hands at the IVE Switch Manila fansign.",
    context,
    members: ["Leeseo"],
    postUrl: "https://x.com/GrantSor/status/1814674895223378300",
    src: "/images/grantsor/leeseo-tiger",
    width: 2731,
    height: 4096,
    sourceUrl:
      "https://pbs.twimg.com/media/GS8FDz2bIAY-oz4?format=jpg&name=orig",
    publishedAt: "2024-07-20T14:53:04Z",
    eventDate,
  },
];
