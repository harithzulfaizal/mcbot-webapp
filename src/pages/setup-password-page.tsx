import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Command } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api";

export default function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Missing setup token.");
        setIsValidating(false);
        return;
      }
      try {
        const response = await fetch(apiUrl("/auth/setup-password/validate"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || "Invalid setup token.");
        }
        setUsername(String(data.username || ""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid setup token.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/auth/setup-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Failed to set password.");
      }

      setSuccess("Password set successfully. Redirecting to login...");
      window.setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Command className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Set your password
          </h2>
          {username ? <p className="mt-2 text-sm text-slate-300">Account: {username}</p> : null}
        </div>
        <form
          className="mt-8 space-y-6 rounded-xl bg-slate-800 p-8 shadow-2xl"
          onSubmit={handleSubmit}
        >
          {isValidating ? <p className="text-sm text-slate-300">Validating link...</p> : null}
          {error ? (
            <div className="rounded-md border border-red-700 bg-red-900 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-md border border-emerald-700 bg-emerald-900 p-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}
          {!isValidating && !error ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-slate-300">
                  New Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-slate-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 shadow-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Please wait..." : "Set password"}
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
