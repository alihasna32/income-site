"use client";

import { useRef, useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ContactPage() {
  const [status, setStatus] = useState("idle");
  const submittingRef = useRef(false);
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
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
        let message = "Could not send your message right now";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // keep default
        }
        toast(message, "error");
      }
    } catch {
      setStatus("idle");
      toast("Could not send your message right now", "error");
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <div className="py-8 min-[425px]:py-10 sm:py-14">
      <div className="container-page max-w-2xl min-w-0">
        <PageHeader
          title="Contact us"
          description="Questions, feedback or a game idea? We read every message."
        />

        <form onSubmit={submit} className="card mt-6 min-w-0 overflow-hidden border border-base-300 bg-base-100 p-4 shadow-card min-[425px]:mt-8 min-[425px]:p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="form-control min-w-0">
              <span className="label-text mb-1.5 text-sm font-semibold">Name</span>
              <input
                name="name"
                required
                className="input input-bordered w-full min-w-0 text-base sm:text-sm"
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label className="form-control min-w-0">
              <span className="label-text mb-1.5 text-sm font-semibold">Email</span>
              <input
                name="email"
                type="email"
                required
                className="input input-bordered w-full min-w-0 text-base sm:text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          </div>
          <label className="form-control mt-4 min-w-0">
            <span className="label-text mb-1.5 text-sm font-semibold">Subject</span>
            <input
              name="subject"
              required
              className="input input-bordered w-full min-w-0 text-base sm:text-sm"
              placeholder="How can we help?"
            />
          </label>
          <label className="form-control mt-4 min-w-0">
            <span className="label-text mb-1.5 text-sm font-semibold">Message</span>
            <textarea
              name="message"
              required
              rows="5"
              className="textarea textarea-bordered w-full min-w-0 text-base sm:text-sm"
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

          <div className="mt-6 flex min-w-0 flex-col gap-3 text-sm text-muted">
            <span className="flex min-w-0 items-start gap-2 break-words">
              <Mail className="mt-0.5 size-4 shrink-0 text-secondary" /> hello@coinquest.example
            </span>
            <span className="flex min-w-0 items-start gap-2 break-words">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-secondary" /> Community channel: coming soon
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
