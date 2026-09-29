import type { ThoughtPriority, ThoughtStatus } from "@/lib/validations/thought";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      thoughts: {
        Row: {
          id: string;
          user_id: string;
          heading: string;
          elaboration: string;
          created_at: string;
          updated_at: string;
          user_rating: number | null;
          system_rating: number | null;
          priority: ThoughtPriority;
          status: ThoughtStatus;
          archived: boolean;
          system_rating_details: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          heading: string;
          elaboration: string;
          created_at?: string;
          updated_at?: string;
          user_rating?: number | null;
          system_rating?: number | null;
          priority?: ThoughtPriority;
          status?: ThoughtStatus;
          archived?: boolean;
          system_rating_details?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          heading?: string;
          elaboration?: string;
          created_at?: string;
          updated_at?: string;
          user_rating?: number | null;
          system_rating?: number | null;
          priority?: ThoughtPriority;
          status?: ThoughtStatus;
          archived?: boolean;
          system_rating_details?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};