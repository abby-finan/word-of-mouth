"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CategoryCard } from "@/components/recommendations/CategoryCard";
import { getCurrentProfile, getCategoryCounts, CATEGORIES } from "@/lib/actions";
import { getGreeting } from "@/lib/constants";
import { Profile } from "@/types/database";
import { RecommendationCategory } from "@/types/database";
export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([
        getCurrentProfile(),
        getCategoryCounts(),
      ]);
      setProfile(p);
      setCounts(c);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = CATEGORIES.filter((cat) =>
    cat.pluralLabel.toLowerCase().includes(search.toLowerCase())
  );

  function handleCategoryClick(category: RecommendationCategory) {
    router.push(`/home/${category}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-warm-gray-light">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-8 pb-4">
        <p className="text-warm-gray text-sm">
          {getGreeting()}
          {profile ? `, ${profile.first_name}` : ""}
        </p>
        <h1 className="text-2xl font-semibold text-charcoal mt-1 tracking-tight">
          Find the people your people trust.
        </h1>
      </div>

      <div className="px-5 mb-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray-light"
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-charcoal/10 bg-white pl-11 pr-4 py-3 text-charcoal placeholder:text-warm-gray-light focus:outline-none focus:ring-2 focus:ring-sage/40"
          />
        </div>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat.id}
              count={counts[cat.id] || 0}
              onClick={() => handleCategoryClick(cat.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-warm-gray py-12">
            No categories match your search.
          </p>
        )}

        {Object.keys(counts).length === 0 && !search && (
          <div className="mt-8 text-center px-4">
            <p className="text-warm-gray text-sm leading-relaxed">
              Add friends and share your recommendations to see trusted providers
              from your network.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
