"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Lock, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(json?.error?.message ?? "Invalid password");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error, try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin access
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the admin password to continue.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              required
              className={cn("h-12 text-center text-base", error && "ring-2 ring-destructive")}
            />
            {error && (
              <p className="text-center text-sm font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={busy || !password}
            className="w-full gap-2"
          >
            {busy ? "Signing in…" : (
              <>
                <LogIn className="h-4 w-4" /> Sign in
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          The password is set via the <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">ADMIN_SECRET</code> environment variable.
        </p>
      </div>
    </div>
  );
}
