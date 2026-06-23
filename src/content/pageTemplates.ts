export interface PageSection {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  layout: "text" | "image-left" | "image-right" | "feature";
  sortOrder: number;
}

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  heroImageUrl?: string | null;
  accentImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  isPublished: boolean;
  sections: PageSection[];
}

export const defaultPages: ContentPage[] = [
  {
    slug: "about",
    title: "About IVE Fan Project",
    description: "Overview and mission for your platform.",
    heroImageUrl: null,
    accentImageUrl: null,
    ctaLabel: "Explore members",
    ctaUrl: "/",
    isPublished: true,
    sections: [
      {
        id: "about-intro",
        title: "Welcome",
        body: "Use this page to explain your project, audience, and goals.",
        imageUrl: null,
        layout: "feature",
        sortOrder: 1,
      },
      {
        id: "about-story",
        title: "Story",
        body: "Share the background of your fan project and your backend-powered roadmap.",
        imageUrl: null,
        layout: "text",
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "community",
    title: "Community Hub",
    description: "Rules, updates, and contribution notes.",
    heroImageUrl: null,
    accentImageUrl: null,
    ctaLabel: "Open quizzes",
    ctaUrl: "/quiz/daily",
    isPublished: true,
    sections: [
      {
        id: "community-rules",
        title: "Community Rules",
        body: "List behavior guidelines and moderation notes.",
        imageUrl: null,
        layout: "text",
        sortOrder: 1,
      },
      {
        id: "community-contribute",
        title: "How to Contribute",
        body: "Explain how community members can submit updates, media, or corrections.",
        imageUrl: null,
        layout: "text",
        sortOrder: 2,
      },
    ],
  },
];
