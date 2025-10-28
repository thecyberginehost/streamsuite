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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          points: number
          requirements: Json
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          points?: number
          requirements: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          requirements?: Json
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
          workflow_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
          workflow_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          consecutive_failures: number | null
          created_at: string
          id: string
          is_active: boolean
          is_healthy: boolean | null
          key_name: string
          key_type: string
          key_value: string
          last_used_at: string | null
          rate_limit_resets_at: string | null
          requests_count: number | null
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_healthy?: boolean | null
          key_name: string
          key_type?: string
          key_value: string
          last_used_at?: string | null
          rate_limit_resets_at?: string | null
          requests_count?: number | null
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_healthy?: boolean | null
          key_name?: string
          key_type?: string
          key_value?: string
          last_used_at?: string | null
          rate_limit_resets_at?: string | null
          requests_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      claude_key_metrics: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          id: string
          is_healthy: boolean | null
          key_name: string
          key_type: string
          last_used_at: string | null
          rate_limit_resets_at: string | null
          requests_count: number | null
          updated_at: string | null
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_healthy?: boolean | null
          key_name: string
          key_type: string
          last_used_at?: string | null
          rate_limit_resets_at?: string | null
          requests_count?: number | null
          updated_at?: string | null
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          is_healthy?: boolean | null
          key_name?: string
          key_type?: string
          last_used_at?: string | null
          rate_limit_resets_at?: string | null
          requests_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      forge_conversions: {
        Row: {
          conversion_status: string | null
          conversion_time_ms: number | null
          converted_workflow: Json | null
          created_at: string | null
          deployed_workflow_id: string | null
          error_details: Json | null
          error_message: string | null
          execution_status: string | null
          execution_time_ms: number | null
          id: string
          nodes_count: number | null
          source_platform: string
          source_workflow: Json
          target_platform: string | null
          tenant_id: string
          user_id: string | null
          workflow_name: string | null
        }
        Insert: {
          conversion_status?: string | null
          conversion_time_ms?: number | null
          converted_workflow?: Json | null
          created_at?: string | null
          deployed_workflow_id?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_status?: string | null
          execution_time_ms?: number | null
          id?: string
          nodes_count?: number | null
          source_platform: string
          source_workflow: Json
          target_platform?: string | null
          tenant_id: string
          user_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          conversion_status?: string | null
          conversion_time_ms?: number | null
          converted_workflow?: Json | null
          created_at?: string | null
          deployed_workflow_id?: string | null
          error_details?: Json | null
          error_message?: string | null
          execution_status?: string | null
          execution_time_ms?: number | null
          id?: string
          nodes_count?: number | null
          source_platform?: string
          source_workflow?: Json
          target_platform?: string | null
          tenant_id?: string
          user_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      forge_metrics: {
        Row: {
          id: string
          last_updated: string | null
          successful_conversions: number | null
          tenant_id: string
          total_conversions: number | null
          total_cost_saved: number | null
          total_time_saved_hours: number | null
        }
        Insert: {
          id?: string
          last_updated?: string | null
          successful_conversions?: number | null
          tenant_id: string
          total_conversions?: number | null
          total_cost_saved?: number | null
          total_time_saved_hours?: number | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          successful_conversions?: number | null
          tenant_id?: string
          total_conversions?: number | null
          total_cost_saved?: number | null
          total_time_saved_hours?: number | null
        }
        Relationships: []
      }
      forge_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          expected_output: Json
          id: string
          is_demo: boolean | null
          nodes: number | null
          platform: string
          source_json: Json
          template_name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          expected_output: Json
          id?: string
          is_demo?: boolean | null
          nodes?: number | null
          platform: string
          source_json: Json
          template_name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          expected_output?: Json
          id?: string
          is_demo?: boolean | null
          nodes?: number | null
          platform?: string
          source_json?: Json
          template_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          commercial_license_active: boolean | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commercial_license_active?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commercial_license_active?: boolean | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          progress: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          progress?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          progress?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          json_example: Json | null
          platform: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          json_example?: Json | null
          platform: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          json_example?: Json | null
          platform?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          steps: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          steps: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          steps?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_forge_metrics: {
        Args: {
          p_cost_saved?: number
          p_tenant_id: string
          p_time_saved?: number
        }
        Returns: undefined
      }
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
