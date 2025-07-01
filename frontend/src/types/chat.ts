export interface IChat {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistory {
  total_count: number;
  items: {
    content: string;
    sender_type: string;
    created_at: string;
    request_id: string;
  }[];
}

export interface AttachedFile {
  id: string;
  name: string;
}
