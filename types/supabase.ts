export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
        }
        Insert: {
          id?: string
          email: string
          name?: string
        }
        Update: {
          email?: string
          name?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          name?: string
        }
      }
    }
  }
}
