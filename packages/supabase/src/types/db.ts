export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      access_tokens: {
        Row: {
          created_at: string;
          token: string;
          user_id: string;
        };
        Insert: {
          created_at: string;
          token: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      account_info: {
        Row: {
          account_id: string;
          info: Json;
        };
        Insert: {
          account_id: string;
          info: Json;
        };
        Update: {
          account_id?: string;
          info?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "account_info_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: true;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      account_scopes: {
        Row: {
          account_id: string;
          scope: string;
        };
        Insert: {
          account_id: string;
          scope: string;
        };
        Update: {
          account_id?: string;
          scope?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_scopes_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          first_name: string | null;
          hosted_domain: string | null;
          id: string;
          is_primary: boolean;
          last_name: string | null;
          profile_photo_url: string | null;
          provider_name: string;
          provider_user_id: string;
          user_id: string;
        };
        Insert: {
          created_at: string;
          display_name?: string | null;
          email: string;
          first_name?: string | null;
          hosted_domain?: string | null;
          id: string;
          is_primary: boolean;
          last_name?: string | null;
          profile_photo_url?: string | null;
          provider_name: string;
          provider_user_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string;
          first_name?: string | null;
          hosted_domain?: string | null;
          id?: string;
          is_primary?: boolean;
          last_name?: string | null;
          profile_photo_url?: string | null;
          provider_name?: string;
          provider_user_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_accounts: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          provider: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          provider: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          provider?: string;
        };
        Relationships: [];
      };
      calendar_color_definitions: {
        Row: {
          background: string | null;
          foreground: string | null;
          id: string;
          kind: string;
        };
        Insert: {
          background?: string | null;
          foreground?: string | null;
          id: string;
          kind: string;
        };
        Update: {
          background?: string | null;
          foreground?: string | null;
          id?: string;
          kind?: string;
        };
        Relationships: [];
      };
      calendar_conference_properties: {
        Row: {
          allowed_conference_solution_type: string;
          calendar_id: string;
        };
        Insert: {
          allowed_conference_solution_type: string;
          calendar_id: string;
        };
        Update: {
          allowed_conference_solution_type?: string;
          calendar_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_conference_properties_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_default_reminders: {
        Row: {
          calendar_id: string;
          method: string;
          minutes: number;
        };
        Insert: {
          calendar_id: string;
          method: string;
          minutes: number;
        };
        Update: {
          calendar_id?: string;
          method?: string;
          minutes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_default_reminders_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_event_attendees: {
        Row: {
          calendar_id: string;
          contact_id: string | null;
          display_name: string | null;
          email: string;
          event_id: string;
          is_organizer: boolean | null;
          is_self: boolean | null;
          optional: boolean | null;
          response_status: string | null;
        };
        Insert: {
          calendar_id: string;
          contact_id?: string | null;
          display_name?: string | null;
          email: string;
          event_id: string;
          is_organizer?: boolean | null;
          is_self?: boolean | null;
          optional?: boolean | null;
          response_status?: string | null;
        };
        Update: {
          calendar_id?: string;
          contact_id?: string | null;
          display_name?: string | null;
          email?: string;
          event_id?: string;
          is_organizer?: boolean | null;
          is_self?: boolean | null;
          optional?: boolean | null;
          response_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_attendees_calendar_id_event_id_fkey";
            columns: ["calendar_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["calendar_id", "id"];
          },
          {
            foreignKeyName: "calendar_event_attendees_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_event_conferences: {
        Row: {
          calendar_id: string;
          conference_id: string | null;
          event_id: string;
          name: string | null;
          type: string | null;
          url: string | null;
        };
        Insert: {
          calendar_id: string;
          conference_id?: string | null;
          event_id: string;
          name?: string | null;
          type?: string | null;
          url?: string | null;
        };
        Update: {
          calendar_id?: string;
          conference_id?: string | null;
          event_id?: string;
          name?: string | null;
          type?: string | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_conferences_calendar_id_event_id_fkey";
            columns: ["calendar_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["calendar_id", "id"];
          },
        ];
      };
      calendar_event_reminders: {
        Row: {
          calendar_id: string;
          event_id: string;
          method: string;
          minutes: number;
        };
        Insert: {
          calendar_id: string;
          event_id: string;
          method: string;
          minutes: number;
        };
        Update: {
          calendar_id?: string;
          event_id?: string;
          method?: string;
          minutes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_reminders_calendar_id_event_id_fkey";
            columns: ["calendar_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["calendar_id", "id"];
          },
        ];
      };
      calendar_events: {
        Row: {
          calendar_id: string;
          color_id: string | null;
          contact_id: string | null;
          created: string | null;
          creator_email: string | null;
          description: string | null;
          end_date: string | null;
          end_time: string | null;
          etag: string | null;
          guests_can_invite_others: boolean | null;
          guests_can_modify: boolean | null;
          guests_can_see_other_guests: boolean | null;
          i_cal_uid: string | null;
          id: string;
          is_all_day: boolean | null;
          location: string | null;
          organizer_email: string | null;
          original_start_time: string | null;
          recurrence: string[] | null;
          recurring_event_id: string | null;
          sequence: number | null;
          start_date: string | null;
          start_time: string | null;
          status: string | null;
          summary: string | null;
          transparency: string | null;
          updated: string | null;
          visibility: string | null;
        };
        Insert: {
          calendar_id: string;
          color_id?: string | null;
          contact_id?: string | null;
          created?: string | null;
          creator_email?: string | null;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          etag?: string | null;
          guests_can_invite_others?: boolean | null;
          guests_can_modify?: boolean | null;
          guests_can_see_other_guests?: boolean | null;
          i_cal_uid?: string | null;
          id: string;
          is_all_day?: boolean | null;
          location?: string | null;
          organizer_email?: string | null;
          original_start_time?: string | null;
          recurrence?: string[] | null;
          recurring_event_id?: string | null;
          sequence?: number | null;
          start_date?: string | null;
          start_time?: string | null;
          status?: string | null;
          summary?: string | null;
          transparency?: string | null;
          updated?: string | null;
          visibility?: string | null;
        };
        Update: {
          calendar_id?: string;
          color_id?: string | null;
          contact_id?: string | null;
          created?: string | null;
          creator_email?: string | null;
          description?: string | null;
          end_date?: string | null;
          end_time?: string | null;
          etag?: string | null;
          guests_can_invite_others?: boolean | null;
          guests_can_modify?: boolean | null;
          guests_can_see_other_guests?: boolean | null;
          i_cal_uid?: string | null;
          id?: string;
          is_all_day?: boolean | null;
          location?: string | null;
          organizer_email?: string | null;
          original_start_time?: string | null;
          recurrence?: string[] | null;
          recurring_event_id?: string | null;
          sequence?: number | null;
          start_date?: string | null;
          start_time?: string | null;
          status?: string | null;
          summary?: string | null;
          transparency?: string | null;
          updated?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_list_state: {
        Row: {
          data: Json;
          user_id: string;
        };
        Insert: {
          data: Json;
          user_id: string;
        };
        Update: {
          data?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_list_state_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_list_state_accounts: {
        Row: {
          account_id: string;
          id: number;
          user_id: string | null;
        };
        Insert: {
          account_id: string;
          id?: number;
          user_id?: string | null;
        };
        Update: {
          account_id?: string;
          id?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_list_state_accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_list_state_calendars: {
        Row: {
          account_id: number | null;
          active: boolean | null;
          calendar_id: string;
          id: number;
          selected: boolean | null;
        };
        Insert: {
          account_id?: number | null;
          active?: boolean | null;
          calendar_id: string;
          id?: number;
          selected?: boolean | null;
        };
        Update: {
          account_id?: number | null;
          active?: boolean | null;
          calendar_id?: string;
          id?: number;
          selected?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_list_state_calendars_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "calendar_list_state_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_notification_settings: {
        Row: {
          calendar_id: string;
          method: string;
          notification_type: string;
        };
        Insert: {
          calendar_id: string;
          method: string;
          notification_type: string;
        };
        Update: {
          calendar_id?: string;
          method?: string;
          notification_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_notification_settings_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_sync_tokens: {
        Row: {
          calendar_id: string;
          sync_token: string;
        };
        Insert: {
          calendar_id: string;
          sync_token: string;
        };
        Update: {
          calendar_id?: string;
          sync_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_sync_tokens_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: true;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
        ];
      };
      calendars: {
        Row: {
          access_role: string | null;
          account_id: string;
          background_color: string | null;
          color_id: string | null;
          description: string | null;
          emoji: string | null;
          etag: string | null;
          foreground_color: string | null;
          id: string;
          is_primary: boolean | null;
          kind: string | null;
          provider: string;
          selected: boolean | null;
          subtitle: string | null;
          summary: string | null;
          time_zone: string | null;
        };
        Insert: {
          access_role?: string | null;
          account_id: string;
          background_color?: string | null;
          color_id?: string | null;
          description?: string | null;
          emoji?: string | null;
          etag?: string | null;
          foreground_color?: string | null;
          id: string;
          is_primary?: boolean | null;
          kind?: string | null;
          provider: string;
          selected?: boolean | null;
          subtitle?: string | null;
          summary?: string | null;
          time_zone?: string | null;
        };
        Update: {
          access_role?: string | null;
          account_id?: string;
          background_color?: string | null;
          color_id?: string | null;
          description?: string | null;
          emoji?: string | null;
          etag?: string | null;
          foreground_color?: string | null;
          id?: string;
          is_primary?: boolean | null;
          kind?: string | null;
          provider?: string;
          selected?: boolean | null;
          subtitle?: string | null;
          summary?: string | null;
          time_zone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendars_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "calendar_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      completed_welcome_checklist_ids: {
        Row: {
          checklist_id: string;
          id: number;
          user_id: string | null;
        };
        Insert: {
          checklist_id: string;
          id?: number;
          user_id?: string | null;
        };
        Update: {
          checklist_id?: string;
          id?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "completed_welcome_checklist_ids_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_email_addresses: {
        Row: {
          contact_id: string;
          email: string;
          formatted_type: string | null;
          is_primary: boolean | null;
          source_id: string | null;
          source_type: string | null;
          type: string | null;
        };
        Insert: {
          contact_id: string;
          email: string;
          formatted_type?: string | null;
          is_primary?: boolean | null;
          source_id?: string | null;
          source_type?: string | null;
          type?: string | null;
        };
        Update: {
          contact_id?: string;
          email?: string;
          formatted_type?: string | null;
          is_primary?: boolean | null;
          source_id?: string | null;
          source_type?: string | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_email_addresses_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_names: {
        Row: {
          contact_id: string;
          display_name: string | null;
          display_name_last_first: string | null;
          first_name: string | null;
          is_primary: boolean | null;
          last_name: string | null;
          source_id: string;
          source_type: string | null;
          unstructured_name: string | null;
        };
        Insert: {
          contact_id: string;
          display_name?: string | null;
          display_name_last_first?: string | null;
          first_name?: string | null;
          is_primary?: boolean | null;
          last_name?: string | null;
          source_id: string;
          source_type?: string | null;
          unstructured_name?: string | null;
        };
        Update: {
          contact_id?: string;
          display_name?: string | null;
          display_name_last_first?: string | null;
          first_name?: string | null;
          is_primary?: boolean | null;
          last_name?: string | null;
          source_id?: string;
          source_type?: string | null;
          unstructured_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_names_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_photos: {
        Row: {
          contact_id: string;
          is_default: boolean | null;
          is_primary: boolean | null;
          source_id: string;
          source_type: string | null;
          url: string | null;
        };
        Insert: {
          contact_id: string;
          is_default?: boolean | null;
          is_primary?: boolean | null;
          source_id: string;
          source_type?: string | null;
          url?: string | null;
        };
        Update: {
          contact_id?: string;
          is_default?: boolean | null;
          is_primary?: boolean | null;
          source_id?: string;
          source_type?: string | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_photos_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          account_id: string;
          display_name: string | null;
          email: string | null;
          etag: string | null;
          id: string;
          photo_url: string | null;
          resource_name: string;
          type: string | null;
        };
        Insert: {
          account_id: string;
          display_name?: string | null;
          email?: string | null;
          etag?: string | null;
          id: string;
          photo_url?: string | null;
          resource_name: string;
          type?: string | null;
        };
        Update: {
          account_id?: string;
          display_name?: string | null;
          email?: string | null;
          etag?: string | null;
          id?: string;
          photo_url?: string | null;
          resource_name?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "calendar_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      default_conferencing: {
        Row: {
          provider_name: string;
          user_id: string;
        };
        Insert: {
          provider_name: string;
          user_id: string;
        };
        Update: {
          provider_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "default_conferencing_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      device_type_details: {
        Row: {
          days_per_period: number | null;
          density_zoom_level: number | null;
          device_type: string;
          interface_theme: string | null;
          max_visible_time_zones: number | null;
          show_declined_events: boolean | null;
          show_week_numbers: boolean | null;
          user_id: string;
        };
        Insert: {
          days_per_period?: number | null;
          density_zoom_level?: number | null;
          device_type: string;
          interface_theme?: string | null;
          max_visible_time_zones?: number | null;
          show_declined_events?: boolean | null;
          show_week_numbers?: boolean | null;
          user_id: string;
        };
        Update: {
          days_per_period?: number | null;
          density_zoom_level?: number | null;
          device_type?: string;
          interface_theme?: string | null;
          max_visible_time_zones?: number | null;
          show_declined_events?: boolean | null;
          show_week_numbers?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_type_details_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      device_types: {
        Row: {
          data: Json;
          user_id: string;
        };
        Insert: {
          data: Json;
          user_id: string;
        };
        Update: {
          data?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "device_types_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
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
      preferences: {
        Row: {
          auto_add_conferencing_prompt_viewed: boolean | null;
          auto_change_time_zones_prompt_enabled: boolean | null;
          dismissed_referral_card: boolean | null;
          dismissed_welcome_checklist: boolean | null;
          dismissed_welcome_dialog: boolean | null;
          preferred_locale: string | null;
          primary_time_zone: string | null;
          show_week_numbers: boolean | null;
          shown_welcome_dialog: boolean | null;
          user_id: string;
        };
        Insert: {
          auto_add_conferencing_prompt_viewed?: boolean | null;
          auto_change_time_zones_prompt_enabled?: boolean | null;
          dismissed_referral_card?: boolean | null;
          dismissed_welcome_checklist?: boolean | null;
          dismissed_welcome_dialog?: boolean | null;
          preferred_locale?: string | null;
          primary_time_zone?: string | null;
          show_week_numbers?: boolean | null;
          shown_welcome_dialog?: boolean | null;
          user_id: string;
        };
        Update: {
          auto_add_conferencing_prompt_viewed?: boolean | null;
          auto_change_time_zones_prompt_enabled?: boolean | null;
          dismissed_referral_card?: boolean | null;
          dismissed_welcome_checklist?: boolean | null;
          dismissed_welcome_dialog?: boolean | null;
          preferred_locale?: string | null;
          primary_time_zone?: string | null;
          show_week_numbers?: boolean | null;
          shown_welcome_dialog?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
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
      recent_participants: {
        Row: {
          display_name: string | null;
          email: string;
          id: number;
          user_id: string | null;
        };
        Insert: {
          display_name?: string | null;
          email: string;
          id?: number;
          user_id?: string | null;
        };
        Update: {
          display_name?: string | null;
          email?: string;
          id?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recent_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      recent_places: {
        Row: {
          formatted_address: string | null;
          google_place_id: string | null;
          id: number;
          name: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          formatted_address?: string | null;
          google_place_id?: string | null;
          id?: number;
          name: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          formatted_address?: string | null;
          google_place_id?: string | null;
          id?: number;
          name?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recent_places_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      recent_time_zones: {
        Row: {
          id: number;
          time_zone_id: string;
          user_id: string | null;
        };
        Insert: {
          id?: number;
          time_zone_id: string;
          user_id?: string | null;
        };
        Update: {
          id?: number;
          time_zone_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recent_time_zones_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sync_logs: {
        Row: {
          created_at: string | null;
          id: string;
          message: string | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          message?: string | null;
          status: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sync_logs_user_id_fkey";
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
      time_zone_labels: {
        Row: {
          label: string | null;
          time_zone: string;
          user_id: string;
        };
        Insert: {
          label?: string | null;
          time_zone: string;
          user_id: string;
        };
        Update: {
          label?: string | null;
          time_zone?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_zone_labels_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      upcoming_meeting_menu_bar_tray: {
        Row: {
          include_all_day_events: boolean;
          user_id: string;
        };
        Insert: {
          include_all_day_events: boolean;
          user_id: string;
        };
        Update: {
          include_all_day_events?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "upcoming_meeting_menu_bar_tray_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          locale: string | null;
          profile_photo_url: string | null;
          status: string;
        };
        Insert: {
          created_at: string;
          display_name?: string | null;
          email: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          locale?: string | null;
          profile_photo_url?: string | null;
          status: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          locale?: string | null;
          profile_photo_url?: string | null;
          status?: string;
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
      sync_all_user_calendars: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
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
}

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
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
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
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
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
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
