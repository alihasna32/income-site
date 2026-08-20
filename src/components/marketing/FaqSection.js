"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { cn } from "@/lib/utils/cn";

const FAQS = [
  {
    q: "Is CoinQuest free to play?",
    a: "Yes, completely free. There's no purchase required and no real money involved. All rewards are virtual coins and XP designed for fun.",
  },
  {
    q: "Can I earn real money here?",
    a: "No. Coins are virtual rewards for playing. We keep things honest — this is about fun, challenges and friendly competition, not income.",
  },
  {
    q: "How do daily streaks work?",
    a: "Claim your daily reward once per day. Each consecutive day grows your streak and your reward, with a big bonus on day 7 of each cycle.",
  },
  {
    q: "How many games can I play?",
    a: "All games are available to everyone. Each game has a fair daily play limit so rewards stay balanced for all players.",
  },
  {
    q: "What are XP and levels?",
    a: "XP is your progression score — earn it by playing. As your XP grows you level up from Beginner all the way to Living Legend.",
  },
  {
    q: "How do referrals work?",
    a: "Share your unique referral link. When a friend joins with it, you both get a welcome bonus. Self-referrals are blocked automatically.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="py-10 sm:py-12">
      <div className="container-page max-w-3xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know about playing and earning on CoinQuest."
        />
        <div className="mt-8 space-y-2.5">
          {FAQS.map((faq, i) => (
            <div
              key={faq.q}
              className="card bg-base-100 border border-base-300 overflow-hidden"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span className="flex items-center gap-3 font-semibold text-plum">
                  <HelpCircle className="size-5 text-secondary shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 pl-[52px] text-sm leading-relaxed text-muted animate-float-up">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}