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
      calendar_events: {
        Row: {
          all_day: boolean | null;
          anyone_can_add_self: boolean | null;
          attachments: Json | null;
          attendees: Json | null;
          attendees_omitted: boolean | null;
          calendar_id: string | null;
          color_id: string | null;
          conference_data: Json | null;
          created: string | null;
          created_at: string | null;
          creator: Json | null;
          description: string | null;
          end_time: string;
          etag: string | null;
          event_type: string | null;
          extended_properties: Json | null;
          google_event_id: string;
          guests_can_invite_others: boolean | null;
          guests_can_modify: boolean | null;
          guests_can_see_other_guests: boolean | null;
          hangout_link: string | null;
          html_link: string | null;
          ical_uid: string | null;
          id: string;
          is_locked: boolean | null;
          location: string | null;
          organizer: Json | null;
          original_start_time: Json | null;
          private_copy: boolean | null;
          recurrence: string[] | null;
          recurring_event_id: string | null;
          reminders: Json | null;
          sequence: number | null;
          source: Json | null;
          start_time: string;
          status: string | null;
          summary: string | null;
          transparency: string | null;
          updated: string | null;
          updated_at: string | null;
          user_id: string;
          visibility: string | null;
        };
        Insert: {
          all_day?: boolean | null;
          anyone_can_add_self?: boolean | null;
          attachments?: Json | null;
          attendees?: Json | null;
          attendees_omitted?: boolean | null;
          calendar_id?: string | null;
          color_id?: string | null;
          conference_data?: Json | null;
          created?: string | null;
          created_at?: string | null;
          creator?: Json | null;
          description?: string | null;
          end_time: string;
          etag?: string | null;
          event_type?: string | null;
          extended_properties?: Json | null;
          google_event_id: string;
          guests_can_invite_others?: boolean | null;
          guests_can_modify?: boolean | null;
          guests_can_see_other_guests?: boolean | null;
          hangout_link?: string | null;
          html_link?: string | null;
          ical_uid?: string | null;
          id?: string;
          is_locked?: boolean | null;
          location?: string | null;
          organizer?: Json | null;
          original_start_time?: Json | null;
          private_copy?: boolean | null;
          recurrence?: string[] | null;
          recurring_event_id?: string | null;
          reminders?: Json | null;
          sequence?: number | null;
          source?: Json | null;
          start_time: string;
          status?: string | null;
          summary?: string | null;
          transparency?: string | null;
          updated?: string | null;
          updated_at?: string | null;
          user_id: string;
          visibility?: string | null;
        };
        Update: {
          all_day?: boolean | null;
          anyone_can_add_self?: boolean | null;
          attachments?: Json | null;
          attendees?: Json | null;
          attendees_omitted?: boolean | null;
          calendar_id?: string | null;
          color_id?: string | null;
          conference_data?: Json | null;
          created?: string | null;
          created_at?: string | null;
          creator?: Json | null;
          description?: string | null;
          end_time?: string;
          etag?: string | null;
          event_type?: string | null;
          extended_properties?: Json | null;
          google_event_id?: string;
          guests_can_invite_others?: boolean | null;
          guests_can_modify?: boolean | null;
          guests_can_see_other_guests?: boolean | null;
          hangout_link?: string | null;
          html_link?: string | null;
          ical_uid?: string | null;
          id?: string;
          is_locked?: boolean | null;
          location?: string | null;
          organizer?: Json | null;
          original_start_time?: Json | null;
          private_copy?: boolean | null;
          recurrence?: string[] | null;
          recurring_event_id?: string | null;
          reminders?: Json | null;
          sequence?: number | null;
          source?: Json | null;
          start_time?: string;
          status?: string | null;
          summary?: string | null;
          transparency?: string | null;
          updated?: string | null;
          updated_at?: string | null;
          user_id?: string;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_event_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      calendars: {
        Row: {
          access_role: string | null;
          background_color: string | null;
          color_id: string | null;
          conference_properties: Json | null;
          created_at: string | null;
          default_reminders: Json | null;
          deleted: boolean | null;
          description: string | null;
          etag: string | null;
          foreground_color: string | null;
          google_calendar_id: string;
          hidden: boolean | null;
          id: string;
          is_primary: boolean | null;
          notification_settings: Json | null;
          selected: boolean | null;
          summary: string | null;
          summary_override: string | null;
          time_zone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_role?: string | null;
          background_color?: string | null;
          color_id?: string | null;
          conference_properties?: Json | null;
          created_at?: string | null;
          default_reminders?: Json | null;
          deleted?: boolean | null;
          description?: string | null;
          etag?: string | null;
          foreground_color?: string | null;
          google_calendar_id: string;
          hidden?: boolean | null;
          id?: string;
          is_primary?: boolean | null;
          notification_settings?: Json | null;
          selected?: boolean | null;
          summary?: string | null;
          summary_override?: string | null;
          time_zone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_role?: string | null;
          background_color?: string | null;
          color_id?: string | null;
          conference_properties?: Json | null;
          created_at?: string | null;
          default_reminders?: Json | null;
          deleted?: boolean | null;
          description?: string | null;
          etag?: string | null;
          foreground_color?: string | null;
          google_calendar_id?: string;
          hidden?: boolean | null;
          id?: string;
          is_primary?: boolean | null;
          notification_settings?: Json | null;
          selected?: boolean | null;
          summary?: string | null;
          summary_override?: string | null;
          time_zone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      folder: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "folder_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          completed: boolean | null;
          created_at: string;
          due_at: string;
          goal_category: Database["public"]["Enums"]["goal_categories"];
          goal_status: Database["public"]["Enums"]["goal_status"];
          id: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string;
          due_at: string;
          goal_category?: Database["public"]["Enums"]["goal_categories"];
          goal_status?: Database["public"]["Enums"]["goal_status"];
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string;
          due_at?: string;
          goal_category?: Database["public"]["Enums"]["goal_categories"];
          goal_status?: Database["public"]["Enums"]["goal_status"];
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      headers: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          title: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "header_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      integrations: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          provider: Database["public"]["Enums"]["integration_provider"];
          refresh_token: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          provider: Database["public"]["Enums"]["integration_provider"];
          refresh_token?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          provider?: Database["public"]["Enums"]["integration_provider"];
          refresh_token?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: string | null;
          created_at: string;
          folder_id: string;
          id: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          folder_id: string;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          folder_id?: string;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "folder";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string | null;
          project_position: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string | null;
          project_position?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string | null;
          project_position?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tag_tasks: {
        Row: {
          parent_id: string | null;
          tag_id: string;
          task_id: string;
        };
        Insert: {
          parent_id?: string | null;
          tag_id: string;
          task_id: string;
        };
        Update: {
          parent_id?: string | null;
          tag_id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tag_task_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tag_task_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tag_task_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          id: string;
          title: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tag_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          actual_duration: unknown | null;
          assigned_to: string | null;
          blocked_by: string | null;
          body: string | null;
          completed_at: string | null;
          completed_by: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          due_at: string | null;
          estimated_duration: unknown | null;
          header_id: string | null;
          id: string;
          project_id: string | null;
          result: string | null;
          scheduled_for: string | null;
          task_position: number | null;
          task_status: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          actual_duration?: unknown | null;
          assigned_to?: string | null;
          blocked_by?: string | null;
          body?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          due_at?: string | null;
          estimated_duration?: unknown | null;
          header_id?: string | null;
          id?: string;
          project_id?: string | null;
          result?: string | null;
          scheduled_for?: string | null;
          task_position?: number | null;
          task_status?: Database["public"]["Enums"]["task_status"];
          title: string;
          updated_at?: string;
          updated_by?: string;
        };
        Update: {
          actual_duration?: unknown | null;
          assigned_to?: string | null;
          blocked_by?: string | null;
          body?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          due_at?: string | null;
          estimated_duration?: unknown | null;
          header_id?: string | null;
          id?: string;
          project_id?: string | null;
          result?: string | null;
          scheduled_for?: string | null;
          task_position?: number | null;
          task_status?: Database["public"]["Enums"]["task_status"];
          title?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_blocked_by_fkey";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_header_id_fkey";
            columns: ["header_id"];
            isOneToOne: false;
            referencedRelation: "headers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          locale: string | null;
          week_starts_on_monday: boolean | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          locale?: string | null;
          week_starts_on_monday?: boolean | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          locale?: string | null;
          week_starts_on_monday?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      gtrgm_compress: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: {
          "": unknown;
        };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      set_limit: {
        Args: {
          "": number;
        };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: {
          "": string;
        };
        Returns: string[];
      };
      sync_calendar: {
        Args: {
          p_user_id: string;
          p_calendars: Json;
          p_events: Json;
        };
        Returns: Json;
      };
      unaccent: {
        Args: {
          "": string;
        };
        Returns: string;
      };
      unaccent_init: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
    };
    Enums: {
      goal_categories: "health" | "work" | "personal" | "family" | "spiritual";
      goal_status: "pending" | "in_progress" | "completed";
      integration_provider: "WHOOP" | "GOOGLE";
      source: "agent" | "user";
      task_status: "pending" | "in_progress" | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

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
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

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
    : never;
