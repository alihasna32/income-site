"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ContactPage() {
  const [status, setStatus] = useState("idle");
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
    };

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("sent");
        toast("Message sent — thanks for reaching out!", "success");
        e.currentTarget.reset();
      } else {
        setStatus("idle");
        toast("Could not send your message right now", "error");
      }
    } catch {
      setStatus("idle");
      toast("Could not send your message right now", "error");
    }
  };

  return (
    <div className="py-10 sm:py-14">
      <div className="container-page max-w-2xl">
        <PageHeader
          title="Contact us"
          description="Questions, feedback or a game idea? We read every message."
        />

        <form onSubmit={submit} className="card bg-base-100 border border-base-300 shadow-card p-6 mt-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-1.5 text-sm font-semibold">Name</span>
              <input
                name="name"
                required
                className="input input-bordered"
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1.5 text-sm font-semibold">Email</span>
              <input
                name="email"
                type="email"
                required
                className="input input-bordered"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          </div>
          <label className="form-control mt-4">
            <span className="label-text mb-1.5 text-sm font-semibold">Subject</span>
            <input
              name="subject"
              required
              className="input input-bordered"
              placeholder="How can we help?"
            />
          </label>
          <label className="form-control mt-4">
            <span className="label-text mb-1.5 text-sm font-semibold">Message</span>
            <textarea
              name="message"
              required
              rows="5"
              className="textarea textarea-bordered"
              placeholder="Tell us everything…"
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary mt-6 w-full sm:w-auto"
            disabled={status === "sending"}
          >
            {status === "sending" ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Send className="size-4" />
            )}
            Send message
          </button>

          <div className="mt-6 flex flex-col gap-3 text-sm text-muted">
            <span className="flex items-center gap-2">
              <Mail className="size-4 text-secondary" /> hello@coinquest.example
            </span>
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4 text-secondary" /> Community channel: coming soon
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}