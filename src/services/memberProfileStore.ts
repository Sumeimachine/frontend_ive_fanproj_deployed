import membersDataRaw from "../assets/members.json";
import { memberApi } from "./api/memberApi";
import type { MemberProfile } from "../types/member";

const STORAGE_KEY = "ive-member-profiles";

const defaultsById: Record<string, Omit<MemberProfile, "id" | "name" | "photoUrl">> = {
  yujin: {
    tagline: "Leader • Charisma Core",
    bio: "Yujin brings confidence, sharp stage control, and warm leadership energy to IVE.",
    accent: "#9F7AEA",
  },
  wonyoung: {
    tagline: "Center • Elegance Icon",
    bio: "Wonyoung is known for polished visuals, graceful delivery, and standout center presence.",
    accent: "#F687B3",
  },
  liz: {
    tagline: "Main Vocal • Honey Tone",
    bio: "Liz delivers rich vocal color and emotional tone that shapes IVE's sound identity.",
    accent: "#63B3ED",
  },
  gaeul: {
    tagline: "Main Dancer • Chic Flow",
    bio: "Gaeul balances precision and calm confidence with clean, stylish performance details.",
    accent: "#B794F4",
  },
  rei: {
    tagline: "Rapper • Creative Spark",
    bio: "Rei adds playful personality and unique rap color that energizes every stage.",
    accent: "#ED64A6",
  },
  leeseo: {
    tagline: "Maknae • Bright Power",
    bio: "Leeseo brings youthful brightness and dynamic momentum to IVE's team chemistry.",
    accent: "#38B2AC",
  },
};

const baseMembers = membersDataRaw as Array<{ id: string; name: string; photoUrl: string }>;

const buildDefaults = (): MemberProfile[] =>
  baseMembers.map((member) => ({
    ...member,
    ...(defaultsById[member.id] ?? {
      tagline: "IVE Member",
      bio: "Official profile details will be added soon.",
      accent: "#9F7AEA",
    }),
  }));

export const loadMemberProfiles = (): MemberProfile[] => {
  const fallback = buildDefaults();
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved) as MemberProfile[];
    const parsedById = new Map(parsed.map((member) => [member.id, member]));

    return fallback.map((member) => parsedById.get(member.id) ?? member);
  } catch {
    return fallback;
  }
};

export const getMemberProfiles = async (): Promise<MemberProfile[]> => {
  try {
    const data = await memberApi.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch {
    return loadMemberProfiles();
  }
};

export const getMemberProfileById = async (memberId: string): Promise<MemberProfile | null> => {
  try {
    const data = await memberApi.getById(memberId);
    return data;
  } catch {
    const localProfile = loadMemberProfiles().find((member) => member.id === memberId);
    return localProfile ?? null;
  }
};

export const saveMemberProfile = async (updatedMember: MemberProfile): Promise<MemberProfile> => {
  try {
    const data = await memberApi.update(updatedMember.id, updatedMember);
    const merged = loadMemberProfiles().map((member) =>
      member.id === data.id ? data : member,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return data;
  } catch {
    throw new Error("Failed to save member profile to backend.");
  }
};

export const saveMemberProfileLocally = (updatedMember: MemberProfile): MemberProfile[] => {
  const merged = loadMemberProfiles().map((member) =>
    member.id === updatedMember.id ? updatedMember : member,
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};
