import { RecommendationCategory } from "@/types/database";
import {
  Axe,
  Baby,
  Bug,
  Car,
  Dog,
  Droplets,
  Dumbbell,
  Flower2,
  Hammer,
  Heart,
  HeartHandshake,
  Home,
  Layers,
  MoreHorizontal,
  Paintbrush,
  PawPrint,
  Scissors,
  Sparkles,
  TreeDeciduous,
  Trees,
  Truck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface CategoryInfo {
  id: RecommendationCategory;
  label: string;
  pluralLabel: string;
  /** Short subtitle shown on category detail pages */
  description?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "plumber",
    label: "Plumber",
    pluralLabel: "Plumbers",
    icon: Wrench,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "electrician",
    label: "Electrician",
    pluralLabel: "Electricians",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    id: "landscaper",
    label: "Landscaper",
    pluralLabel: "Landscapers",
    icon: Trees,
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
  {
    id: "lawn_care",
    label: "Lawn Care",
    pluralLabel: "Lawn Care",
    icon: Flower2,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "painter",
    label: "Painter",
    pluralLabel: "Painters",
    icon: Paintbrush,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    id: "handyman",
    label: "Handyman",
    pluralLabel: "Handymen",
    icon: Hammer,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: "babysitter",
    label: "Babysitter",
    pluralLabel: "Babysitters",
    icon: Baby,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    id: "pet_sitter",
    label: "Pet Sitter",
    pluralLabel: "Pet Sitters",
    icon: PawPrint,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    id: "dog_walker",
    label: "Dog Walker",
    pluralLabel: "Dog Walkers",
    icon: Dog,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "elderly_caretaker",
    label: "Elderly Caretaker",
    pluralLabel: "Elderly Caretakers",
    icon: HeartHandshake,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
  },
  {
    id: "personal_trainer",
    label: "Personal Trainer",
    pluralLabel: "Personal Trainers",
    icon: Dumbbell,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "therapist",
    label: "Therapist",
    pluralLabel: "Therapists",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    id: "hair_stylist",
    label: "Hair Stylist / Barber",
    pluralLabel: "Hair Stylists & Barbers",
    icon: Scissors,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "pest_control",
    label: "Pest Control",
    pluralLabel: "Pest Control",
    icon: Bug,
    color: "text-lime-700",
    bgColor: "bg-lime-50",
  },
  {
    id: "gutter_cleaner",
    label: "Gutter Cleaner",
    pluralLabel: "Gutter Cleaners",
    icon: Droplets,
    color: "text-sky-600",
    bgColor: "bg-sky-50",
  },
  {
    id: "tree_trimming",
    label: "Tree Trimming",
    pluralLabel: "Tree Trimming",
    icon: TreeDeciduous,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  {
    id: "wallpaper_installer",
    label: "Wallpaper Installer",
    pluralLabel: "Wallpaper Installers",
    icon: Layers,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    id: "woodworker",
    label: "Woodworker",
    pluralLabel: "Woodworkers",
    icon: Axe,
    color: "text-amber-800",
    bgColor: "bg-amber-50",
  },
  {
    id: "house_cleaner",
    label: "House Cleaner",
    pluralLabel: "House Cleaners",
    icon: Home,
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
  },
  {
    id: "mover",
    label: "Mover",
    pluralLabel: "Movers",
    icon: Truck,
    color: "text-slate-700",
    bgColor: "bg-slate-50",
  },
  {
    id: "mechanic",
    label: "Mechanic",
    pluralLabel: "Mechanics",
    icon: Car,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
  },
  {
    id: "hvac",
    label: "HVAC",
    pluralLabel: "HVAC",
    icon: Wind,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  {
    id: "cleaner",
    label: "Cleaner",
    pluralLabel: "Cleaners",
    icon: Sparkles,
    color: "text-teal-700",
    bgColor: "bg-teal-50",
  },
  {
    id: "other",
    label: "Other",
    pluralLabel: "Other Services",
    description:
      "Other home & personal services recommended by friends",
    icon: MoreHorizontal,
    color: "text-stone-600",
    bgColor: "bg-stone-50",
  },
];

export function getCategoryInfo(category: RecommendationCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
}

export function getCategoryFriendsEmptyState(
  category: RecommendationCategory
): string {
  if (category === "other") {
    return "No friends have shared recommendations in additional services yet. Ask friends to share pest control, movers, house cleaners, and other trusted providers.";
  }

  const info = getCategoryInfo(category);
  const label = info.label.toLowerCase();
  return `No friends have shared a ${label} yet. Ask your friends to add their trusted ${label}!`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getInitials(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";

  return trimmed
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
