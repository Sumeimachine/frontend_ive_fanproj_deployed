export interface PageSection {
  id: string;
  title: string;
  body: string;
}

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  sections: PageSection[];
}

export const defaultPages: ContentPage[] = [
  {
    slug: "about",
    title: "About IVE Fan Project",
    description: "Overview and mission for your platform.",
    sections: [
      {
        id: "about-intro",
        title: "Welcome",
        body: "Use this page to explain your project, audience, and goals.",
      },
      {
        id: "about-story",
        title: "Story",
        body: "Share the background of your fan project and your backend-powered roadmap.",
      },
    ],
  },
  {
    slug: "community",
    title: "Community Hub",
    description: "Rules, updates, and contribution notes.",
    sections: [
      {
        id: "community-rules",
        title: "Community Rules",
        body: "List behavior guidelines and moderation notes.",
      },
      {
        id: "community-contribute",
        title: "How to Contribute",
        body: "Explain how community members can submit updates, media, or corrections.",
      },
    ],
  },
];
