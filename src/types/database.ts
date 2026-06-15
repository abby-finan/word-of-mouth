export type RecommendationCategory =
  | "plumber"
  | "babysitter"
  | "dog_walker"
  | "electrician"
  | "lawn_care"
  | "hair_stylist"
  | "handyman"
  | "therapist"
  | "pet_sitter"
  | "other";

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface Profile {
  id: string;
  first_name: string;
  city: string | null;
  neighborhood: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  category: RecommendationCategory;
  provider_name: string;
  provider_photo_url: string | null;
  phone: string | null;
  note: string | null;
  how_i_know_them: string | null;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface SavedRecommendation {
  id: string;
  user_id: string;
  recommendation_id: string;
  created_at: string;
}

export interface RecommendationWithProfile extends Recommendation {
  profile: Profile;
}

export interface SavedRecommendationWithDetails extends SavedRecommendation {
  recommendation: Recommendation & { profile: Profile };
}

export interface FriendshipWithProfile extends Friendship {
  friend: Profile;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      recommendations: {
        Row: Recommendation;
        Insert: Omit<Recommendation, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Recommendation, "id" | "user_id">>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Friendship, "id">>;
        Relationships: [];
      };
      saved_recommendations: {
        Row: SavedRecommendation;
        Insert: Omit<SavedRecommendation, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SavedRecommendation, "id">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_users_by_email: {
        Args: { search_email: string };
        Returns: Pick<Profile, "id" | "first_name" | "city" | "neighborhood" | "avatar_url">[];
      };
      search_users_by_contact: {
        Args: { search_query: string };
        Returns: Pick<
          Profile,
          "id" | "first_name" | "city" | "neighborhood" | "avatar_url" | "phone_number"
        >[];
      };
    };
  };
}
