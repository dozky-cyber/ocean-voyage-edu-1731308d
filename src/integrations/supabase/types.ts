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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      consultations: {
        Row: {
          admin_notes: string | null
          ai_business_category: string | null
          ai_complexity: string | null
          ai_conversation: Json
          ai_lead_score: number
          ai_problems: Json
          ai_qualification_status: string | null
          ai_recommended_package: string | null
          ai_requirements: Json
          ai_summary: string | null
          budget: string
          business_name: string | null
          clicked_ctas: Json
          company: string | null
          created_at: string
          device_type: string | null
          email: string
          features: string | null
          id: string
          journey: Json
          landing_page: string | null
          lead_score: number
          lead_source: string
          lead_temperature: string
          name: string
          notes: string | null
          project_type: string
          referrer: string | null
          requirement: string
          selected_package: string | null
          status: string
          status_updated_at: string
          timeline: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          viewed_products: Json
          visit_duration_seconds: number
          visited_pages: Json
          visitor_source: string | null
          whatsapp: string
        }
        Insert: {
          admin_notes?: string | null
          ai_business_category?: string | null
          ai_complexity?: string | null
          ai_conversation?: Json
          ai_lead_score?: number
          ai_problems?: Json
          ai_qualification_status?: string | null
          ai_recommended_package?: string | null
          ai_requirements?: Json
          ai_summary?: string | null
          budget: string
          business_name?: string | null
          clicked_ctas?: Json
          company?: string | null
          created_at?: string
          device_type?: string | null
          email: string
          features?: string | null
          id?: string
          journey?: Json
          landing_page?: string | null
          lead_score?: number
          lead_source?: string
          lead_temperature?: string
          name: string
          notes?: string | null
          project_type: string
          referrer?: string | null
          requirement: string
          selected_package?: string | null
          status?: string
          status_updated_at?: string
          timeline: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_products?: Json
          visit_duration_seconds?: number
          visited_pages?: Json
          visitor_source?: string | null
          whatsapp: string
        }
        Update: {
          admin_notes?: string | null
          ai_business_category?: string | null
          ai_complexity?: string | null
          ai_conversation?: Json
          ai_lead_score?: number
          ai_problems?: Json
          ai_qualification_status?: string | null
          ai_recommended_package?: string | null
          ai_requirements?: Json
          ai_summary?: string | null
          budget?: string
          business_name?: string | null
          clicked_ctas?: Json
          company?: string | null
          created_at?: string
          device_type?: string | null
          email?: string
          features?: string | null
          id?: string
          journey?: Json
          landing_page?: string | null
          lead_score?: number
          lead_source?: string
          lead_temperature?: string
          name?: string
          notes?: string | null
          project_type?: string
          referrer?: string | null
          requirement?: string
          selected_package?: string | null
          status?: string
          status_updated_at?: string
          timeline?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_products?: Json
          visit_duration_seconds?: number
          visited_pages?: Json
          visitor_source?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      lead_ai_activities: {
        Row: {
          action: string
          content: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          label: string | null
          lead_id: string
          meta: Json
        }
        Insert: {
          action: string
          content: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          label?: string | null
          lead_id: string
          meta?: Json
        }
        Update: {
          action?: string
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          label?: string | null
          lead_id?: string
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          investment_note: string | null
          note: string | null
          pricing_items: Json
          proposal_id: string
          recommended_package: string | null
          timeline_note: string | null
          title: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          investment_note?: string | null
          note?: string | null
          pricing_items?: Json
          proposal_id: string
          recommended_package?: string | null
          timeline_note?: string | null
          title: string
          version: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          investment_note?: string | null
          note?: string | null
          pricing_items?: Json
          proposal_id?: string
          recommended_package?: string | null
          timeline_note?: string | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          approved_at: string | null
          client_name: string | null
          content: Json
          created_at: string
          created_by: string | null
          currency: string
          id: string
          investment_note: string | null
          lead_id: string
          pricing_items: Json
          recommended_package: string | null
          rejected_at: string | null
          sent_at: string | null
          status: string
          timeline_note: string | null
          title: string
          updated_at: string
          valid_until: string | null
          version: number
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          client_name?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          investment_note?: string | null
          lead_id: string
          pricing_items?: Json
          recommended_package?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          timeline_note?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
          version?: number
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          client_name?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          investment_note?: string | null
          lead_id?: string
          pricing_items?: Json
          recommended_package?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          timeline_note?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
          version?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      lead_cta_performance: {
        Row: {
          clicks: number | null
          cta: string | null
        }
        Relationships: []
      }
      lead_monthly_trend: {
        Row: {
          avg_score: number | null
          leads: number | null
          month: string | null
        }
        Relationships: []
      }
      lead_product_interest: {
        Row: {
          product: string | null
          views: number | null
        }
        Relationships: []
      }
      lead_source_performance: {
        Row: {
          avg_score: number | null
          campaign: string | null
          hot_leads: number | null
          leads: number | null
          source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_business: { Args: { _user_id: string }; Returns: boolean }
      can_work_leads: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_access: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "user" | "owner" | "sales" | "viewer"
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
    Enums: {
      app_role: ["admin", "staff", "user", "owner", "sales", "viewer"],
    },
  },
} as const
