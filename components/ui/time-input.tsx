"use client";

import { Input } from "./input";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeInput({ value, onChange }: TimeInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
