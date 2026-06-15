import { RecommendationCategory } from "@/types/database";
import {
  Baby,
  Dog,
  Flower2,
  Hammer,
  Heart,
  PawPrint,
  Scissors,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface CategoryInfo {
  id: RecommendationCategory;
  label: string;
  pluralLabel: string;
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
    id: "babysitter",
    label: "Babysitter",
    pluralLabel: "Babysitters",
    icon: Baby,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
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
    id: "electrician",
    label: "Electrician",
    pluralLabel: "Electricians",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
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
    id: "hair_stylist",
    label: "Hair Stylist",
    pluralLabel: "Hair Stylists",
    icon: Scissors,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
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
    id: "therapist",
    label: "Therapist",
    pluralLabel: "Therapists",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    id: "pet_sitter",
    label: "Pet Sitter",
    pluralLabel: "Pet Sitters",
    icon: PawPrint,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
];

export function getCategoryInfo(category: RecommendationCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getInitials(name: string): string {
  return name
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
