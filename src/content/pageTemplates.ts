export interface PageSection {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  layout: "text" | "image-left" | "image-right" | "feature";
  sortOrder: number;
}

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  heroImageUrl?: string | null;
  heroImagePositionX?: number | null;
  heroImagePositionY?: number | null;
  accentImageUrl?: string | null;
  accentImagePositionX?: number | null;
  accentImagePositionY?: number | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  isPublished: boolean;
  sections: PageSection[];
}

export const defaultPages: ContentPage[] = [
  {
    slug: "about",
    title: "About the IVE PH Fan Project",
    description:
      "IVEPH is an independent, non-commercial fan-support space built by Filipino DIVEs to celebrate IVE through member profiles, quizzes, fan events, and interactive experiences.",
    heroImageUrl: null,
    heroImagePositionX: 50,
    heroImagePositionY: 50,
    accentImageUrl: null,
    accentImagePositionX: 50,
    accentImagePositionY: 50,
    ctaLabel: "Meet the members",
    ctaUrl: "/",
    isPublished: true,
    sections: [
      {
        id: "about-intro",
        title: "Built by fans, for fans",
        body:
          "IVEPH brings DIVEs together in one fan-built space where visitors can explore member profiles, follow community activities, test their knowledge, and enjoy interactive content inspired by IVE.",
        imageUrl: null,
        imagePositionX: 50,
        imagePositionY: 50,
        layout: "feature",
        sortOrder: 1,
      },
      {
        id: "about-story",
        title: "An independent fan project",
        body:
          "This website is independently created and maintained for fan-support purposes. It is not affiliated with IVE, Starship Entertainment, or any official merchandise project. Artist names, images, and related media belong to their respective owners.",
        imageUrl: null,
        imagePositionX: 50,
        imagePositionY: 50,
        layout: "text",
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "community",
    title: "Community Hub",
    description:
      "A welcoming space for DIVEs to join quizzes, follow fan updates, share corrections, and help improve the community.",
    heroImageUrl: null,
    heroImagePositionX: 50,
    heroImagePositionY: 50,
    accentImageUrl: null,
    accentImagePositionX: 50,
    accentImagePositionY: 50,
    ctaLabel: "Start the daily quiz",
    ctaUrl: "/quiz/daily",
    isPublished: true,
    sections: [
      {
        id: "community-rules",
        title: "Community Rules",
        body:
          "Keep discussions respectful and welcoming. Do not post harassment, hate speech, spam, impersonation, private information, or uncredited media. Clearly distinguish opinions and rumors from confirmed information, and provide reliable sources when submitting factual corrections.",
        imageUrl: null,
        imagePositionX: 50,
        imagePositionY: 50,
        layout: "text",
        sortOrder: 1,
      },
      {
        id: "community-contribute",
        title: "How to Contribute",
        body:
          "Found outdated information or have an idea for an event, correction, or feature? Contact the site administrators with the relevant page link, your proposed change, and a reliable source. Only submit media you own or have permission to share.",
        imageUrl: null,
        imagePositionX: 50,
        imagePositionY: 50,
        layout: "text",
        sortOrder: 2,
      },
    ],
  },
];
