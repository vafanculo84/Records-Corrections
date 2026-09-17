"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block">
        <span className="form-label">Email</span>
        <input
          className="form-control mt-2"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </label>
      <label className="block">
        <span className="form-label">Password</span>
        <input
          className="form-control mt-2"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="primary-button w-full" disabled={pending} type="submit">
        <LogIn aria-hidden="true" size={19} />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
