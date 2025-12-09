import { signInWithGoogle } from "../firebase";
export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed");
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-slate-50 text-center">
          Focus <span className="text-indigo-400">Track</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 text-center">
          Minimal team task & focus tracker for your daily grind.
        </p>

        <div className="mt-6 space-y-4">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm font-medium transition"
          >
            <span>🔐</span>
            <span>Continue with Google</span>
          </button>

          {/* rest same as before */}
        </div>
      </div>
    </div>
  );
}
