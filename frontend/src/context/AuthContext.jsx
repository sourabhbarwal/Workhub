// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { api } from "../api";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // firebase user + backend info
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // 🔁 Always upsert / sync user in backend
        // This will create the user if missing, or update email/name if they changed.
        const res = await api.post("/users/syncFromFirebase", {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          // NO role here → we don't overwrite admin/member that was set via POST /users
        });

        const backendUser = res.data;

        setUser({
          ...firebaseUser,
          role: backendUser.role || "member",
          backendId: backendUser._id,
          backend: backendUser,
        });
      } catch (err) {
        console.error("AuthContext user sync error", err);
        // fallback – at least keep firebase user so app doesn't break
        setUser(firebaseUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
