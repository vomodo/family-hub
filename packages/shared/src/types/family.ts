export interface Family {
  id: number;
  name: string;
  createdBy: number;
  createdAt: string;
}

export interface FamilyMember {
  userId: number;
  familyId: number;
  role: 'admin' | 'member';
  colorCode: string;
  joinedAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export interface CreateFamilyInput {
  name: string;
}

export interface InviteMemberInput {
  email: string;
  familyId: number;
}
