export interface MemberProfile {
  id: string;
  name: string;
  photoUrl: string;
  backupPhotoUrl?: string;
  tagline: string;
  bio: string;
  accent: string;
  photoObjectPositionX?: number;
  photoObjectPositionY?: number;
  updatedAtUtc?: string;
}
