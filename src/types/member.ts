export interface MemberProfile {
  id: string;
  name: string;
  photoUrl: string;
  backupPhotoUrl?: string;
  tagline: string;
  bio: string;
  accent: string;
  updatedAtUtc?: string;
}
