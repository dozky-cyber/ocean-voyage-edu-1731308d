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
