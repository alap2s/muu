import { Timestamp } from "firebase/firestore";

export interface RestaurantCollection {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  restaurantIds: string[];
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Follower {
  uid: string;
  followedAt: Timestamp;
}
