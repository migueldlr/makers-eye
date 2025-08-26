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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string
          id: number
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          type?: string
        }
        Relationships: []
      }
      decklists: {
        Row: {
          archetype: string | null
          cards: Json | null
          created_at: string
          id: number
        }
        Insert: {
          archetype?: string | null
          cards?: Json | null
          created_at?: string
          id?: number
        }
        Update: {
          archetype?: string | null
          cards?: Json | null
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      identity_names: {
        Row: {
          long_id: string
          short_id: string | null
        }
        Insert: {
          long_id: string
          short_id?: string | null
        }
        Update: {
          long_id?: string
          short_id?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          corp_id: number | null
          created_at: string
          id: number
          phase: string
          result: string | null
          round: number | null
          runner_id: number | null
          table: number | null
          tournament_id: number
        }
        Insert: {
          corp_id?: number | null
          created_at?: string
          id?: number
          phase?: string
          result?: string | null
          round?: number | null
          runner_id?: number | null
          table?: number | null
          tournament_id: number
        }
        Update: {
          corp_id?: number | null
          created_at?: string
          id?: number
          phase?: string
          result?: string | null
          round?: number | null
          runner_id?: number | null
          table?: number | null
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_corp_id_fkey"
            columns: ["corp_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_corp_id_fkey"
            columns: ["corp_id"]
            isOneToOne: false
            referencedRelation: "standings_mapped"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "standings_mapped"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_player_count"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          corp_deck_id: number | null
          corp_draws: number
          corp_identity: string
          corp_losses: number
          corp_wins: number
          created_at: string
          e_sos: number
          id: number
          match_points: number
          name: string
          runner_deck_id: number | null
          runner_draws: number
          runner_identity: string
          runner_losses: number
          runner_wins: number
          sos: number
          swiss_rank: number
          top_cut_rank: number | null
          tournament_id: number
        }
        Insert: {
          corp_deck_id?: number | null
          corp_draws?: number
          corp_identity?: string
          corp_losses?: number
          corp_wins?: number
          created_at?: string
          e_sos: number
          id?: number
          match_points: number
          name?: string
          runner_deck_id?: number | null
          runner_draws?: number
          runner_identity?: string
          runner_losses?: number
          runner_wins?: number
          sos: number
          swiss_rank?: number
          top_cut_rank?: number | null
          tournament_id: number
        }
        Update: {
          corp_deck_id?: number | null
          corp_draws?: number
          corp_identity?: string
          corp_losses?: number
          corp_wins?: number
          created_at?: string
          e_sos?: number
          id?: number
          match_points?: number
          name?: string
          runner_deck_id?: number | null
          runner_draws?: number
          runner_identity?: string
          runner_losses?: number
          runner_wins?: number
          sos?: number
          swiss_rank?: number
          top_cut_rank?: number | null
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_player_count"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          abr_url: string | null
          cardpool: string | null
          created_at: string
          date: string | null
          format: string | null
          id: number
          last_modified_at: string | null
          location: string | null
          meta: string
          name: string | null
          region: string | null
          url: string | null
        }
        Insert: {
          abr_url?: string | null
          cardpool?: string | null
          created_at?: string
          date?: string | null
          format?: string | null
          id?: number
          last_modified_at?: string | null
          location?: string | null
          meta?: string
          name?: string | null
          region?: string | null
          url?: string | null
        }
        Update: {
          abr_url?: string | null
          cardpool?: string | null
          created_at?: string
          date?: string | null
          format?: string | null
          id?: number
          last_modified_at?: string | null
          location?: string | null
          meta?: string
          name?: string | null
          region?: string | null
          url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      matches_mapped: {
        Row: {
          corp_id: number | null
          corp_short_id: string | null
          phase: string | null
          result: string | null
          round: number | null
          runner_id: number | null
          runner_short_id: string | null
          table: number | null
          tournament_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_corp_id_fkey"
            columns: ["corp_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_corp_id_fkey"
            columns: ["corp_id"]
            isOneToOne: false
            referencedRelation: "standings_mapped"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "standings_mapped"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_player_count"
            referencedColumns: ["id"]
          },
        ]
      }
      standings_mapped: {
        Row: {
          corp_deck_id: number | null
          corp_draws: number | null
          corp_identity: string | null
          corp_losses: number | null
          corp_short_id: string | null
          corp_wins: number | null
          created_at: string | null
          e_sos: number | null
          id: number | null
          match_points: number | null
          name: string | null
          runner_deck_id: number | null
          runner_draws: number | null
          runner_identity: string | null
          runner_losses: number | null
          runner_short_id: string | null
          runner_wins: number | null
          sos: number | null
          swiss_rank: number | null
          top_cut_rank: number | null
          tournament_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments_with_player_count"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments_with_player_count: {
        Row: {
          created_at: string | null
          date: string | null
          format: string | null
          id: number | null
          last_modified_at: string | null
          location: string | null
          meta: string | null
          name: string | null
          player_count: number | null
          region: string | null
          url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      all_runners: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_all_decklist_ids: {
        Args: Record<PropertyKey, never>
        Returns: {
          deck_id: number
        }[]
      }
      get_corp_id_runner_performance: {
        Args: {
          include_cut?: boolean
          include_swiss?: boolean
          meta_filter?: string
          tournament_filter?: number[]
        }
        Returns: {
          distinct_players: number
          id: string
          total_games: number
          total_losses: number
          total_wins: number
          win_rate: number
        }[]
      }
      get_corp_identity_cut_conversion: {
        Args: { tournament_filter?: number[] }
        Returns: {
          cut_conversion: number
          id: string
          players_in_cut: number
          players_with_id: number
        }[]
      }
      get_corp_identity_winrates: {
        Args:
          | {
              include_cut?: boolean
              include_swiss?: boolean
              tournament_filter?: number[]
            }
          | { tournament_filter?: number[] }
        Returns: {
          id: string
          total_draws: number
          total_games: number
          total_losses: number
          total_wins: number
          win_rate: number
        }[]
      }
      get_corp_popularity: {
        Args: {
          include_cut?: boolean
          include_swiss?: boolean
          tournament_filter?: number[]
        }
        Returns: {
          identity: string
          player_count: number
        }[]
      }
      get_corp_vs_runner_winrates: {
        Args: { corp_filter?: string[] }
        Returns: {
          corp_identity: string
          corp_win_rate: number
          corp_wins: number
          draws: number
          runner_identity: string
          runner_wins: number
          total_games: number
        }[]
      }
      get_corp_winrates: {
        Args:
          | { corp_filter?: string[] }
          | {
              corp_filter?: string[]
              include_cut?: boolean
              include_swiss?: boolean
              tournament_filter?: number[]
            }
          | { corp_filter?: string[]; tournament_filter?: number[] }
        Returns: {
          corp_id: string
          corp_win_rate: number
          corp_wins: number
          draws: number
          runner_id: string
          runner_wins: number
          total_games: number
        }[]
      }
      get_cut_conversion: {
        Args: { tournament_filter?: number[] }
        Returns: {
          cut_conversion_percentage: number
          identity: string
          total_cut_appearances: number
          total_entries: number
        }[]
      }
      get_cut_conversion_rate: {
        Args: { tournament_filter?: number[] }
        Returns: {
          baseline_cut_percentage: number
          cut_conversion_percentage: number
          cut_conversion_rate: number
          identity: string
          total_cut_appearances: number
          total_entries: number
        }[]
      }
      get_decklist_cards: {
        Args: { decklist_id: number }
        Returns: {
          card_count: number
          card_id: number
          card_name: string
          card_type: string
        }[]
      }
      get_head_to_head_winrates: {
        Args: {
          include_cut?: boolean
          include_swiss?: boolean
          min_matches?: number
          tournament_filter?: number[]
        }
        Returns: {
          corp_id: string
          corp_wins: number
          draws: number
          runner_id: string
          runner_winrate: number
          runner_wins: number
          total_games: number
        }[]
      }
      get_identity_winrates: {
        Args: { tournament_filter?: number[] }
        Returns: {
          identity: string
          total_draws: number
          total_games: number
          total_losses: number
          total_wins: number
          win_rate: number
        }[]
      }
      get_matches_by_id: {
        Args:
          | {
              corp_filter: string
              phase_filter?: string
              runner_filter: string
              tournament_filter?: number[]
            }
          | {
              corp_filter: string
              runner_filter: string
              tournament_filter?: number[]
            }
        Returns: {
          corp_id: string
          corp_player_name: string
          phase: string
          result: string
          round: number
          round_table: number
          runner_id: string
          runner_player_name: string
          tournament_date: string
          tournament_id: number
          tournament_name: string
          tournament_url: string
        }[]
      }
      get_matches_by_identity: {
        Args: { corp_filter: string; runner_filter: string }
        Returns: {
          corp_id: string
          corp_player_name: string
          phase: string
          result: string
          round: number
          runner_id: string
          runner_player_name: string
          tournament_id: number
          tournament_name: string
        }[]
      }
      get_normalized_side_bias_by_table: {
        Args: { meta_filter: string }
        Returns: {
          corp_winrate: number
          corp_wins: number
          percentile: number
          runner_winrate: number
          runner_wins: number
          total_matches: number
        }[]
      }
      get_opponent_bye_info: {
        Args: { target_tournament_id: number }
        Returns: {
          got_bye: boolean
          opponent_bye_history: string[]
          player_id: number
          player_name: string
        }[]
      }
      get_players_with_round1_bye: {
        Args: { target_tournament_id: number }
        Returns: {
          got_round1_bye: boolean
          player_id: number
          player_name: string
        }[]
      }
      get_runner_cut_conversion_rate: {
        Args: { tournament_filter?: number[] }
        Returns: {
          baseline_cut_percentage: number
          cut_conversion_percentage: number
          cut_conversion_rate: number
          identity: string
          total_cut_appearances: number
          total_entries: number
        }[]
      }
      get_runner_id_corp_performance: {
        Args: {
          include_cut?: boolean
          include_swiss?: boolean
          tournament_filter?: number[]
        }
        Returns: {
          distinct_players: number
          id: string
          total_games: number
          total_losses: number
          total_wins: number
          win_rate: number
        }[]
      }
      get_runner_identity_winrates: {
        Args:
          | {
              include_cut?: boolean
              include_swiss?: boolean
              tournament_filter?: number[]
            }
          | { tournament_filter?: number[] }
        Returns: {
          id: string
          total_draws: number
          total_games: number
          total_losses: number
          total_wins: number
          win_rate: number
        }[]
      }
      get_runner_popularity: {
        Args: {
          include_cut?: boolean
          include_swiss?: boolean
          tournament_filter?: number[]
        }
        Returns: {
          identity: string
          player_count: number
        }[]
      }
      get_runner_winrates: {
        Args:
          | {
              include_cut?: boolean
              include_swiss?: boolean
              runner_filter?: string[]
              tournament_filter?: number[]
            }
          | { runner_filter?: string[]; tournament_filter?: number[] }
        Returns: {
          corp_id: string
          corp_wins: number
          draws: number
          runner_id: string
          runner_win_rate: number
          runner_wins: number
          total_games: number
        }[]
      }
      get_summary_stats: {
        Args: { tournament_filter?: number[] }
        Returns: {
          earliest_tournament: string
          latest_tournament: string
          total_matches: number
          total_players: number
          total_tournaments: number
        }[]
      }
      get_tournament_game_outcomes: {
        Args:
          | {
              include_cut?: boolean
              include_swiss?: boolean
              tournament_filter?: number[]
            }
          | { tournament_filter?: number[] }
        Returns: {
          byes: number
          corp_wins: number
          draws: number
          runner_wins: number
          total_games: number
          unknowns: number
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
