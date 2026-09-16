import { api } from "./client";

export interface Announcement {
  id: string;
  sender_id: string;
  title: string;
  content: string;
  target_role: string;
  target_ids?: string[] | null;
  created_at: string;
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  target_role: string;
  target_ids?: string[];
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get("/announcements");
  return data;
}

export async function createAnnouncement(payload: AnnouncementPayload): Promise<Announcement> {
  const { data } = await api.post("/announcements", payload);
  return data;
}
