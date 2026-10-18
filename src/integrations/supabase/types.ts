export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          category: string | null
          description: string | null
          difficulty: string | null
          duration_days: number | null
          icon: string | null
          id: string
          target_co2_saving: number | null
          title: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          icon?: string | null
          id?: string
          target_co2_saving?: number | null
          title?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number | null
          icon?: string | null
          id?: string
          target_co2_saving?: number | null
          title?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          category: string | null
          co2_kg: number | null
          description: string | null
          id: string
          logged_at: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          co2_kg?: number | null
          description?: string | null
          id?: string
          logged_at?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          co2_kg?: number | null
          description?: string | null
          id?: string
          logged_at?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          username: string | null
          theme_color: string | null
          density: string | null
          auto_generate_reports: boolean | null
          report_email: string | null
          notify_daily_reminder: boolean | null
          notify_daily_time: string | null
          notify_weekly_summary: boolean | null
          notify_challenge_deadlines: boolean | null
          notify_monthly_report: boolean | null
          notify_household_activity: boolean | null
          notify_goal_achieved: boolean | null
          monthly_target: number | null
          yearly_target: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          username?: string | null
          theme_color?: string | null
          density?: string | null
          auto_generate_reports?: boolean | null
          report_email?: string | null
          notify_daily_reminder?: boolean | null
          notify_daily_time?: string | null
          notify_weekly_summary?: boolean | null
          notify_challenge_deadlines?: boolean | null
          notify_monthly_report?: boolean | null
          notify_household_activity?: boolean | null
          notify_goal_achieved?: boolean | null
          monthly_target?: number | null
          yearly_target?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          username?: string | null
          theme_color?: string | null
          density?: string | null
          auto_generate_reports?: boolean | null
          report_email?: string | null
          notify_daily_reminder?: boolean | null
          notify_daily_time?: string | null
          notify_weekly_summary?: boolean | null
          notify_challenge_deadlines?: boolean | null
          notify_monthly_report?: boolean | null
          notify_household_activity?: boolean | null
          notify_goal_achieved?: boolean | null
          monthly_target?: number | null
          yearly_target?: number | null
        }
        Relationships: []
      }
      households: {
        Row: {
          created_at: string
          created_by: string | null
          goal_monthly_kg: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          goal_monthly_kg?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          goal_monthly_kg?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          household_id: string
          id: string
          invite_code: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          household_id: string
          id?: string
          invite_code: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          household_id?: string
          id?: string
          invite_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          data: Json | null
          file_size_kb: number | null
          file_url: string | null
          format: string | null
          generated_at: string | null
          id: string
          period: string | null
          user_id: string | null
        }
        Insert: {
          data?: Json | null
          file_size_kb?: number | null
          file_url?: string | null
          format?: string | null
          generated_at?: string | null
          id?: string
          period?: string | null
          user_id?: string | null
        }
        Update: {
          data?: Json | null
          file_size_kb?: number | null
          file_url?: string | null
          format?: string | null
          generated_at?: string | null
          id?: string
          period?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          challenges_completed: number | null
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          last_logged_date: string | null
          longest_streak: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          challenges_completed?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_logged_date?: string | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenges_completed?: number | null
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_logged_date?: string | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string | null
          co2_saved: number | null
          completed_at: string | null
          id: string
          progress: number | null
          started_at: string | null
          user_id: string | null
          xp_earned: number | null
        }
        Insert: {
          challenge_id?: string | null
          co2_saved?: number | null
          completed_at?: string | null
          id?: string
          progress?: number | null
          started_at?: string | null
          user_id?: string | null
          xp_earned?: number | null
        }
        Update: {
          challenge_id?: string | null
          co2_saved?: number | null
          completed_at?: string | null
          id?: string
          progress?: number | null
          started_at?: string | null
          user_id?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
