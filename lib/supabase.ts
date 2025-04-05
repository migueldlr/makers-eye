export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
          corp_deck_url: string | null
          corp_draws: number
          corp_identity: string
          corp_losses: number
          corp_wins: number
          created_at: string
          e_sos: number
          id: number
          match_points: number
          name: string
          runner_deck_url: string | null
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
          corp_deck_url?: string | null
          corp_draws?: number
          corp_identity?: string
          corp_losses?: number
          corp_wins?: number
          created_at?: string
          e_sos: number
          id?: number
          match_points: number
          name?: string
          runner_deck_url?: string | null
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
          corp_deck_url?: string | null
          corp_draws?: number
          corp_identity?: string
          corp_losses?: number
          corp_wins?: number
          created_at?: string
          e_sos?: number
          id?: number
          match_points?: number
          name?: string
          runner_deck_url?: string | null
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
      get_corp_identity_winrates:
        | {
            Args: {
              tournament_filter?: number[]
            }
            Returns: {
              id: string
              total_games: number
              total_wins: number
              total_losses: number
              total_draws: number
              win_rate: number
            }[]
          }
        | {
            Args: {
              tournament_filter?: number[]
              include_swiss?: boolean
              include_cut?: boolean
            }
            Returns: {
              id: string
              total_games: number
              total_wins: number
              total_losses: number
              total_draws: number
              win_rate: number
            }[]
          }
      get_corp_popularity: {
        Args: {
          tournament_filter?: number[]
          include_swiss?: boolean
          include_cut?: boolean
        }
        Returns: {
          identity: string
          player_count: number
        }[]
      }
      get_corp_vs_runner_winrates: {
        Args: {
          corp_filter?: string[]
        }
        Returns: {
          corp_identity: string
          runner_identity: string
          total_games: number
          corp_wins: number
          runner_wins: number
          draws: number
          corp_win_rate: number
        }[]
      }
      get_corp_winrates:
        | {
            Args: {
              corp_filter?: string[]
            }
            Returns: {
              corp_id: string
              runner_id: string
              total_games: number
              corp_wins: number
              runner_wins: number
              draws: number
              corp_win_rate: number
            }[]
          }
        | {
            Args: {
              corp_filter?: string[]
              tournament_filter?: number[]
            }
            Returns: {
              corp_id: string
              runner_id: string
              total_games: number
              corp_wins: number
              runner_wins: number
              draws: number
              corp_win_rate: number
            }[]
          }
        | {
            Args: {
              corp_filter?: string[]
              tournament_filter?: number[]
              include_swiss?: boolean
              include_cut?: boolean
            }
            Returns: {
              corp_id: string
              runner_id: string
              total_games: number
              corp_wins: number
              runner_wins: number
              draws: number
              corp_win_rate: number
            }[]
          }
      get_cut_conversion: {
        Args: {
          tournament_filter?: number[]
        }
        Returns: {
          identity: string
          total_entries: number
          total_cut_appearances: number
          cut_conversion_percentage: number
        }[]
      }
      get_cut_conversion_rate: {
        Args: {
          tournament_filter?: number[]
        }
        Returns: {
          identity: string
          total_entries: number
          total_cut_appearances: number
          cut_conversion_percentage: number
          baseline_cut_percentage: number
          cut_conversion_rate: number
        }[]
      }
      get_head_to_head_winrates: {
        Args: {
          tournament_filter?: number[]
          min_matches?: number
          include_swiss?: boolean
          include_cut?: boolean
        }
        Returns: {
          runner_id: string
          corp_id: string
          runner_wins: number
          corp_wins: number
          draws: number
          total_games: number
          runner_winrate: number
        }[]
      }
      get_identity_winrates: {
        Args: {
          tournament_filter?: number[]
        }
        Returns: {
          identity: string
          total_games: number
          total_wins: number
          total_losses: number
          total_draws: number
          win_rate: number
        }[]
      }
      get_matches_by_id:
        | {
            Args: {
              runner_filter: string
              corp_filter: string
              tournament_filter?: number[]
            }
            Returns: {
              tournament_id: number
              tournament_name: string
              tournament_url: string
              tournament_date: string
              round: number
              round_table: number
              phase: string
              corp_player_name: string
              runner_player_name: string
              corp_id: string
              runner_id: string
              result: string
            }[]
          }
        | {
            Args: {
              runner_filter: string
              corp_filter: string
              tournament_filter?: number[]
              phase_filter?: string
            }
            Returns: {
              tournament_id: number
              tournament_name: string
              tournament_url: string
              tournament_date: string
              round: number
              round_table: number
              phase: string
              corp_player_name: string
              runner_player_name: string
              corp_id: string
              runner_id: string
              result: string
            }[]
          }
      get_matches_by_identity: {
        Args: {
          runner_filter: string
          corp_filter: string
        }
        Returns: {
          tournament_id: number
          tournament_name: string
          round: number
          phase: string
          corp_player_name: string
          runner_player_name: string
          corp_id: string
          runner_id: string
          result: string
        }[]
      }
      get_runner_cut_conversion_rate: {
        Args: {
          tournament_filter?: number[]
        }
        Returns: {
          identity: string
          total_entries: number
          total_cut_appearances: number
          cut_conversion_percentage: number
          baseline_cut_percentage: number
          cut_conversion_rate: number
        }[]
      }
      get_runner_identity_winrates:
        | {
            Args: {
              tournament_filter?: number[]
            }
            Returns: {
              id: string
              total_games: number
              total_wins: number
              total_losses: number
              total_draws: number
              win_rate: number
            }[]
          }
        | {
            Args: {
              tournament_filter?: number[]
              include_swiss?: boolean
              include_cut?: boolean
            }
            Returns: {
              id: string
              total_games: number
              total_wins: number
              total_losses: number
              total_draws: number
              win_rate: number
            }[]
          }
      get_runner_popularity: {
        Args: {
          tournament_filter?: number[]
          include_swiss?: boolean
          include_cut?: boolean
        }
        Returns: {
          identity: string
          player_count: number
        }[]
      }
      get_runner_winrates:
        | {
            Args: {
              runner_filter?: string[]
              tournament_filter?: number[]
            }
            Returns: {
              runner_id: string
              corp_id: string
              total_games: number
              runner_wins: number
              corp_wins: number
              draws: number
              runner_win_rate: number
            }[]
          }
        | {
            Args: {
              runner_filter?: string[]
              tournament_filter?: number[]
              include_swiss?: boolean
              include_cut?: boolean
            }
            Returns: {
              runner_id: string
              corp_id: string
              total_games: number
              runner_wins: number
              corp_wins: number
              draws: number
              runner_win_rate: number
            }[]
          }
      get_summary_stats:
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              total_matches: number
              total_players: number
              total_tournaments: number
              earliest_tournament: string
              latest_tournament: string
            }[]
          }
        | {
            Args: {
              tournament_filter?: number[]
            }
            Returns: {
              total_matches: number
              total_players: number
              total_tournaments: number
              earliest_tournament: string
              latest_tournament: string
            }[]
          }
      get_tournament_game_outcomes:
        | {
            Args: {
              tournament_filter?: number[]
            }
            Returns: {
              total_games: number
              corp_wins: number
              runner_wins: number
              draws: number
              byes: number
              unknowns: number
            }[]
          }
        | {
            Args: {
              tournament_filter?: number[]
              include_swiss?: boolean
              include_cut?: boolean
            }
            Returns: {
              total_games: number
              corp_wins: number
              runner_wins: number
              draws: number
              byes: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
