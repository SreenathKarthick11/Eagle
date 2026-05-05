export interface EventItem {
  event_id: string | number;
  event_name: string
}

export interface Visitor {
  user_id: string | number;
  username: string
}

// export interface UserSession {
//   user_id: string | number;
// }

export interface CampusItem {
  campus_id: string | number;
  campus_name: string
}

export interface LocationItem {
  location_id: string | number;
  location_name: string
}

export interface VenueItem {
  venue_id: string | number;
  venue_name: string
}

export interface CreateLocation {
  location_name: string;
  landmark: string | null;
  latitude: string
  longitude: string
  campus_id: string | number
}

export interface UserInfoItem {
  user_id: string | number;
  role: string;
  username: string
}
