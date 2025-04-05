export type NrdbDecklist = {
  id: number;
  uuid: string;
  date_creation: string;
  date_update: string;
  name: string;
  description: string;
  user_id: number;
  user_name: string;
  tournament_badge: boolean;
  cards: {
    [id: number]: number;
  };
  mwl_code: string;
};

export type NrdbResponseMetadata = {
  total: number;
  success: boolean;
  version_number: number;
  last_updated: string;
};

export type NrdbDecklistResponse = {
  data: NrdbDecklist[];
} & NrdbResponseMetadata;

export type NrdbCard = {
  title: string;
  type_code: string;
  [k: string]: unknown;
};

export type NrdbCardResponse = {
  data: NrdbCard[];
} & NrdbResponseMetadata;
