export interface TopRecommendation {
  provider_name: string;
  phone: string | null;
  note: string | null;
  recommendation_count: number;
  friend_recommendation_count: number;
  score: number;
  recommendation_id: string;
}

export function formatTopRecommendationMeta(top: TopRecommendation): string {
  const parts: string[] = [];

  parts.push(
    `${top.recommendation_count} recommendation${top.recommendation_count !== 1 ? "s" : ""} nearby`
  );

  if (top.friend_recommendation_count > 0) {
    parts.push(
      `${top.friend_recommendation_count} from friend${top.friend_recommendation_count !== 1 ? "s" : ""}`
    );
  }

  return parts.join(" · ");
}
