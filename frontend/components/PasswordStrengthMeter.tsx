"use client";

import { useMemo } from "react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0 to 4
  label: "Weak" | "Fair" | "Good" | "Strong" | "";
  percent: number;
  barColor: string;
  textColor: string;
  suggestions: string[];
}

export const evaluatePasswordStrength = (password: string): StrengthResult => {
  if (!password) {
    return {
      score: 0,
      label: "",
      percent: 0,
      barColor: "bg-slate-200 dark:bg-slate-800",
      textColor: "text-muted-foreground",
      suggestions: [],
    };
  }

  let points = 0;
  const suggestions: string[] = [];

  const hasLength8 = password.length >= 8;
  const hasLength12 = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLength8) points += 1;
  else suggestions.push("at least 8 characters");

  if (hasLength12) points += 1;

  if (hasUpper) points += 1;
  else suggestions.push("one uppercase letter");

  if (hasLower) points += 1;
  else suggestions.push("one lowercase letter");

  if (hasNumber) points += 1;
  else suggestions.push("one number");

  if (hasSpecial) points += 1;
  else suggestions.push("one special character");

  // Check for common weak patterns or consecutive repeated characters
  const commonWeak = ["password", "123456", "12345678", "qwerty", "admin", "cloudrage"];
  const isCommon = commonWeak.some((weak) => password.toLowerCase().includes(weak));
  const hasRepeated = /(.)\1{2,}/.test(password);

  if (isCommon || hasRepeated) {
    points = Math.max(1, points - 2);
    if (isCommon) suggestions.unshift("avoid common dictionary words");
    if (hasRepeated) suggestions.unshift("avoid repeated characters");
  }

  if (points <= 2) {
    return {
      score: 1,
      label: "Weak",
      percent: 25,
      barColor: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      suggestions,
    };
  }

  if (points <= 4) {
    return {
      score: 2,
      label: "Fair",
      percent: 50,
      barColor: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      suggestions,
    };
  }

  if (points === 5) {
    return {
      score: 3,
      label: "Good",
      percent: 75,
      barColor: "bg-blue-600 dark:bg-blue-400",
      textColor: "text-blue-600 dark:text-blue-400",
      suggestions,
    };
  }

  return {
    score: 4,
    label: "Strong",
    percent: 100,
    barColor: "bg-emerald-600 dark:bg-emerald-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
    suggestions: [],
  };
};

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div
      className="space-y-2 pt-1 text-xs animate-in fade-in duration-150"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          Password strength
        </span>
        <span className={`text-[11px] font-bold ${result.textColor}`}>
          {result.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${result.barColor}`}
          style={{ width: `${result.percent}%` }}
        />
      </div>

      {/* Improvement Guidance */}
      {result.suggestions.length > 0 && result.score < 4 && (
        <div className="pt-1 text-[11px] text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground/80">Add to improve:</p>
          <ul className="space-y-0.5 pl-1">
            {result.suggestions.slice(0, 3).map((suggestion, idx) => (
              <li key={idx} className="flex items-center space-x-1.5">
                <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
