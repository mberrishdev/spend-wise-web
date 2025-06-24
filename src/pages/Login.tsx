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
  const { signInWithGoogle, loading } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">SpendWise Login</h1>
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.74 0 24 0 14.82 0 6.71 5.08 2.69 12.44l7.98 6.2C13.01 13.13 18.13 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.93 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65A14.5 14.5 0 019.5 24c0-1.62.28-3.19.77-4.65l-7.98-6.2A23.93 23.93 0 000 24c0 3.77.9 7.34 2.49 10.49l8.18-5.84z"/><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.15 15.89-5.85l-7.19-5.6c-2.01 1.35-4.59 2.15-8.7 2.15-5.87 0-10.99-3.63-13.33-8.85l-8.18 5.84C6.71 42.92 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
          Sign in with Google
        </button>
        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
      </div>
    </div>
  );
};

export default Login; 