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
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "super_admin";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "super_admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "super_admin";
          created_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          client_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          work_phone: string | null;
          photo_url: string | null;
          department: string;
          designation: string;
          employment_type: string;
          status: Database["public"]["Enums"]["client_status"];
          date_of_joining: string;
          total_experience: number | null;
          date_of_birth: string | null;
          gender: string | null;
          aadhaar: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          work_phone?: string | null;
          photo_url?: string | null;
          department: string;
          designation: string;
          employment_type: string;
          status?: Database["public"]["Enums"]["client_status"];
          date_of_joining: string;
          total_experience?: number | null;
          date_of_birth?: string | null;
          gender?: string | null;
          aadhaar?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          work_phone?: string | null;
          photo_url?: string | null;
          department?: string;
          designation?: string;
          employment_type?: string;
          status?: Database["public"]["Enums"]["client_status"];
          date_of_joining?: string;
          total_experience?: number | null;
          date_of_birth?: string | null;
          gender?: string | null;
          aadhaar?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["client_id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          doc_type: string;
          file_name: string;
          file_url: string;
          content_etag: string | null;
          content_size: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          doc_type: string;
          file_name: string;
          file_url: string;
          content_etag?: string | null;
          content_size?: number | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          doc_type?: string;
          file_name?: string;
          file_url?: string;
          content_etag?: string | null;
          content_size?: number | null;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: never;
        Returns: boolean;
      };
    };
    Enums: {
      client_status: "Active" | "Inactive";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type ClientStatus = Database["public"]["Enums"]["client_status"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type AdminRow = Database["public"]["Tables"]["admin_users"]["Row"];
