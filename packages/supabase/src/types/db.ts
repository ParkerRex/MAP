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
      calendar: {
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
          summary: string;
          summary_override: string | null;
          sync_method: string;
          sync_token: string | null;
          time_zone: string | null;
          updated_at: string | null;
          use_polling: boolean | null;
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
          summary: string;
          summary_override?: string | null;
          sync_method?: string;
          sync_token?: string | null;
          time_zone?: string | null;
          updated_at?: string | null;
          use_polling?: boolean | null;
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
          summary?: string;
          summary_override?: string | null;
          sync_method?: string;
          sync_token?: string | null;
          time_zone?: string | null;
          updated_at?: string | null;
          use_polling?: boolean | null;
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
      calendar_event: {
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
          last_synced_at: string | null;
          location: string | null;
          needs_sync: boolean | null;
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
          last_synced_at?: string | null;
          location?: string | null;
          needs_sync?: boolean | null;
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
          last_synced_at?: string | null;
          location?: string | null;
          needs_sync?: boolean | null;
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
            referencedRelation: "calendar";
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
      calendar_sync_info: {
        Row: {
          channel_id: string | null;
          expiration: string | null;
          google_calendar_id: string;
          id: string;
          last_sync_time: string | null;
          resource_id: string | null;
          sync_method: string;
          sync_token: string | null;
          user_id: string;
        };
        Insert: {
          channel_id?: string | null;
          expiration?: string | null;
          google_calendar_id: string;
          id?: string;
          last_sync_time?: string | null;
          resource_id?: string | null;
          sync_method?: string;
          sync_token?: string | null;
          user_id: string;
        };
        Update: {
          channel_id?: string | null;
          expiration?: string | null;
          google_calendar_id?: string;
          id?: string;
          last_sync_time?: string | null;
          resource_id?: string | null;
          sync_method?: string;
          sync_token?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_sync_info_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      contact: {
        Row: {
          company: string | null;
          contact_name: string | null;
          email: string | null;
          id: string;
          phone_number: string | null;
          user_id: string | null;
        };
        Insert: {
          company?: string | null;
          contact_name?: string | null;
          email?: string | null;
          id?: string;
          phone_number?: string | null;
          user_id?: string | null;
        };
        Update: {
          company?: string | null;
          contact_name?: string | null;
          email?: string | null;
          id?: string;
          phone_number?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_user_id_fkey";
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
      goal: {
        Row: {
          completed: boolean | null;
          created_at: string;
          due_at: string;
          id: string;
          source: Database["public"]["Enums"]["source"];
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string;
          due_at: string;
          id?: string;
          source?: Database["public"]["Enums"]["source"];
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string;
          due_at?: string;
          id?: string;
          source?: Database["public"]["Enums"]["source"];
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
      header: {
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
      integration: {
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
      note: {
        Row: {
          content: string | null;
          created_at: string;
          folder_id: string;
          id: string;
          shared: boolean | null;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          folder_id: string;
          id?: string;
          shared?: boolean | null;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          folder_id?: string;
          id?: string;
          shared?: boolean | null;
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
      project: {
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
      shared_note: {
        Row: {
          note_id: string;
          user_id: string;
        };
        Insert: {
          note_id: string;
          user_id: string;
        };
        Update: {
          note_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shared_note_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "note";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_note_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sync_job: {
        Row: {
          calendars_synced: number | null;
          created_at: string | null;
          details: Json | null;
          error_message: string | null;
          events_synced: number | null;
          id: string;
          job_type: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          calendars_synced?: number | null;
          created_at?: string | null;
          details?: Json | null;
          error_message?: string | null;
          events_synced?: number | null;
          id?: string;
          job_type: string;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          calendars_synced?: number | null;
          created_at?: string | null;
          details?: Json | null;
          error_message?: string | null;
          events_synced?: number | null;
          id?: string;
          job_type?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sync_job_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tag: {
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
      tag_task: {
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
            referencedRelation: "tag";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tag_task_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tag";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tag_task_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "task";
            referencedColumns: ["id"];
          },
        ];
      };
      task: {
        Row: {
          actual_duration: unknown | null;
          assigned_to: string | null;
          blocked_by: string | null;
          body: string | null;
          cognitive_load: number | null;
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
          proposal: string | null;
          resources: string[] | null;
          result: string | null;
          scheduled_for: string | null;
          source_type: Database["public"]["Enums"]["source"];
          task_position: number | null;
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          actual_duration?: unknown | null;
          assigned_to?: string | null;
          blocked_by?: string | null;
          body?: string | null;
          cognitive_load?: number | null;
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
          proposal?: string | null;
          resources?: string[] | null;
          result?: string | null;
          scheduled_for?: string | null;
          source_type?: Database["public"]["Enums"]["source"];
          task_position?: number | null;
          title: string;
          updated_at?: string;
          updated_by?: string;
        };
        Update: {
          actual_duration?: unknown | null;
          assigned_to?: string | null;
          blocked_by?: string | null;
          body?: string | null;
          cognitive_load?: number | null;
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
          proposal?: string | null;
          resources?: string[] | null;
          result?: string | null;
          scheduled_for?: string | null;
          source_type?: Database["public"]["Enums"]["source"];
          task_position?: number | null;
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
            referencedRelation: "task";
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
            foreignKeyName: "task_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contact";
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
            referencedRelation: "header";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project";
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
          full_name: string | null;
          id: string;
          timezone: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          timezone?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          timezone?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      webhook_channel: {
        Row: {
          channel_id: string;
          created_at: string | null;
          expiration: string | null;
          google_calendar_id: string;
          id: string;
          resource_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          channel_id: string;
          created_at?: string | null;
          expiration?: string | null;
          google_calendar_id: string;
          id?: string;
          resource_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          channel_id?: string;
          created_at?: string | null;
          expiration?: string | null;
          google_calendar_id?: string;
          id?: string;
          resource_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_and_start_sync_job: {
        Args: {
          p_user_id: string;
          p_job_type: string;
        };
        Returns: {
          id: string;
          user_id: string;
          status: string;
          job_type: string;
          created_at: string;
          updated_at: string;
          error_message: string;
          calendars_synced: number;
          events_synced: number;
        }[];
      };
      hnswhandler: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: {
          "": unknown;
        };
        Returns: unknown;
      };
      sync_calendars: {
        Args: {
          user_id: string;
          calendars: Json;
        };
        Returns: Json;
      };
      sync_events: {
        Args: {
          user_id: string;
          calendar_id: string;
          events: Json;
        };
        Returns: Json;
      };
      update_sync_job_status: {
        Args: {
          job_id: string;
          status: string;
          error_message?: string;
          calendars_synced?: number;
          events_synced?: number;
        };
        Returns: undefined;
      };
      update_task_tags: {
        Args: {
          task_id: string;
          tag_titles: string[];
        };
        Returns: undefined;
      };
      vector_avg: {
        Args: {
          "": number[];
        };
        Returns: string;
      };
      vector_dims: {
        Args: {
          "": string;
        };
        Returns: number;
      };
      vector_norm: {
        Args: {
          "": string;
        };
        Returns: number;
      };
      vector_out: {
        Args: {
          "": string;
        };
        Returns: unknown;
      };
      vector_send: {
        Args: {
          "": string;
        };
        Returns: string;
      };
      vector_typmod_in: {
        Args: {
          "": unknown[];
        };
        Returns: number;
      };
    };
    Enums: {
      integration_provider: "WHOOP" | "GOOGLE";
      source: "agent" | "user";
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
