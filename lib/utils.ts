import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const formatDate = (d: Date | string) => format(new Date(d), "MMM d, yyyy");
export const formatDateTime = (d: Date | string) => format(new Date(d), "MMM d, yyyy · h:mm a");
export const timeAgo = (d: Date | string) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const isOverdue = (d: Date | string) => isPast(new Date(d));

export function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function statusBadgeClass(status: string) {
  const s = status.toLowerCase().replace(/ /g, "_");
  return `badge status-${s}`;
}

export function calcWeightedScore(criteriaScores: Array<{ score: number; weight: number }>): number {
  const totalWeight = criteriaScores.reduce((s, c) => s + c.weight, 0);
  if (!totalWeight) return 0;
  const weighted = criteriaScores.reduce((s, c) => s + (c.score / 10) * c.weight, 0);
  return Math.round((weighted / totalWeight) * 100);
}

export const DEFAULT_EVALUATION_CRITERIA = [
  { key: "CODE_QUALITY",    label: "Code Quality",      weight: 20, enabled: true },
  { key: "CONSISTENCY",     label: "Consistency",        weight: 15, enabled: true },
  { key: "TIMELINESS",      label: "Timeliness",         weight: 15, enabled: true },
  { key: "PROBLEM_SOLVING", label: "Problem Solving",    weight: 20, enabled: true },
  { key: "COMMUNICATION",   label: "Communication",      weight: 15, enabled: true },
  { key: "LEARNING",        label: "Learning Attitude",  weight: 15, enabled: true },
];

export function scoreGrade(score: number) {
  if (score >= 90) return { label: "Exceptional",  color: "#22c97b" };
  if (score >= 75) return { label: "Excellent",    color: "#22c97b" };
  if (score >= 60) return { label: "Good",         color: "#f5a623" };
  if (score >= 45) return { label: "Satisfactory", color: "#f5a623" };
  return             { label: "Needs Work",        color: "#ff5252" };
}
