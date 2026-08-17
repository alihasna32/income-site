"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";

export function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="btn btn-ghost btn-sm"
      aria-label={`${label}: ${value}`}
    >
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : label}</span>
    </button>
  );
}