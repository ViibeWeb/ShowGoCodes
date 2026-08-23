export type DbEvent = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  venue: string | null;
  event_date: string;
  event_time: string | null;
  category: string;
  artist: string | null;
  genre: string | null;
  created_at: string;
};

export type FilterLogic = 'AND' | 'OR';

export type ActiveFilters = {
  category: string[];
  artist: string[];
  genre: string[];
};
