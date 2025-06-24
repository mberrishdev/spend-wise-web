import React from "react";
import { useAuth } from "@/hooks/useAuth";

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

const Login: React.FC = () => {
  const { signInWithGoogle, loading, user } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      let message = "Failed to sign in";
      if (isErrorWithMessage(e)) {
        message = e.message;
      }
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-blue-100 via-white to-green-100 overflow-hidden">
      {/* Animated SVG blob background */}
      <svg
        className="absolute -top-32 -left-32 w-[500px] h-[500px] opacity-30 blur-2xl animate-pulse"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="250"
          cy="250"
          rx="250"
          ry="200"
          fill="url(#paint0_radial)"
        />
        <defs>
          <radialGradient
            id="paint0_radial"
            cx="0"
            cy="0"
            r="1"
            gradientTransform="translate(250 250) scale(250 200)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#34D399" stopOpacity="0.7" />
          </radialGradient>
        </defs>
      </svg>
      <div className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-8 flex flex-col items-center gap-8 z-10">
        <div className="flex flex-col items-center gap-2 w-full">
          <a href="/">
            <img
              src="/logo.png"
              alt="SpendWise Logo"
              className="w-12 h-12 mb-1"
            />
          </a>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 text-center tracking-tight">
            Welcome to SpendWise
          </h1>
          <p className="text-gray-700 text-center text-base mb-2 max-w-xs">
            Plan, log, and understand your spending with privacy-first finance
            tracking.
          </p>
        </div>
        {user ? (
          <div className="flex flex-col items-center gap-2 w-full">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-full border shadow"
              />
            )}
            <div className="text-lg font-semibold text-gray-800">
              {user.displayName || "User"}
            </div>
            <div className="text-gray-500 text-sm">{user.email}</div>
            <div className="mt-4 text-green-600 font-medium">
              You are logged in!
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:scale-95 border border-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg text-lg shadow transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
              style={{ boxShadow: "0 2px 8px 0 rgba(60,130,246,0.08)" }}
            >
              {loading ? (
                <svg
                  className="w-6 h-6 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              ) : (
                <svg
                  width="20px"
                  height="20px"
                  viewBox="-3 0 262 262"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid"
                >
                  <path
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    fill="#4285F4"
                  />
                  <path
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    fill="#34A853"
                  />
                  <path
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                    fill="#FBBC05"
                  />
                  <path
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    fill="#EB4335"
                  />
                </svg>
              )}
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
            <div className="text-xs text-gray-500 text-center w-full mt-3">
              No credit card required. We never see or sell your data.
            </div>
          </>
        )}
        {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
        <div className="flex items-center gap-2 mt-6 text-xs text-gray-400">
          <span>Privacy-first. Secure by Firebase.</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
