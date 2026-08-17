import { Settings2, Wrench } from "lucide-react";

export function SetupRequired() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="card w-full max-w-xl bg-base-100 border border-base-300 shadow-soft p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Wrench className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-plum">Almost ready — connect Supabase</h1>
            <p className="text-sm text-muted">
              CoinQuest is fully built and wired up. It needs your Supabase
              project to store accounts, wallets and rewards.
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold">1</span>
            <span>
              Create a free project at{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-secondary underline"
              >
                supabase.com
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold">2</span>
            <span>
              Copy your Project URL and anon key into <code className="rounded bg-base-200 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
              (see <code className="rounded bg-base-200 px-1.5 py-0.5 text-xs">.env.example</code>).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold">3</span>
            <span>
              Run <code className="rounded bg-base-200 px-1.5 py-0.5 text-xs">supabase/schema.sql</code> then{" "}
              <code className="rounded bg-base-200 px-1.5 py-0.5 text-xs">supabase/seed.sql</code> in the
              Supabase SQL editor.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold">4</span>
            <span>Restart the dev server and refresh this page.</span>
          </li>
        </ol>

        <div className="mt-6 rounded-box bg-base-200 p-4 text-xs text-muted flex gap-2">
          <Settings2 className="size-4 shrink-0 text-secondary" />
          <span>
            The service role key lives in{" "}
            <code className="rounded bg-base-100 px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> and is
            only used on the server for secure reward crediting. Never expose it
            in client code.
          </span>
        </div>
      </div>
    </div>
  );
}