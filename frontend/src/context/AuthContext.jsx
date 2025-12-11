// // frontend/src/context/AuthContext.jsx
// import { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "../firebase";
// import { api } from "../api";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null); // firebase user + backend info
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (!firebaseUser) {
//         setUser(null);
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await api.get("/users/byUid", {
//           params: { firebaseUid: firebaseUser.uid },
//         });
//         const backendUser = res.data;

//         // 🔥 This is what Layout reads
//         setUser({
//           ...firebaseUser,
//           role: backendUser.role,
//           backendId: backendUser._id,
//           backend: backendUser,
//         });
//       } catch (err) {
//         console.error("AuthContext backend user fetch error", err);
//         // fallback – at least set firebase user, but with no role
//         setUser(firebaseUser);
//       } finally {
//         setLoading(false);
//       }
//     });

//     return () => unsub();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);

// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { api } from "../api";

const AuthContext = createContext(null);

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

      const firebaseUid = firebaseUser.uid;

      try {
        let backendUser = null;

        // 1. Try to fetch existing backend user
        try {
          const res = await api.get("/users/byUid", {
            params: { firebaseUid },
          });
          backendUser = res.data;
        } catch (err) {
          // 404 here means "User not found" – create it
          if (err.response && err.response.status === 404) {
            try {
              const syncRes = await api.post("/users/syncFromFirebase", {
                firebaseUid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email,
                // default role – you can manually change in DB to "admin"
                role: "member",
              });
              backendUser = syncRes.data;
            } catch (syncErr) {
              console.error("AuthContext user sync error", syncErr);
            }
          } else {
            throw err;
          }
        }

        if (backendUser) {
          setUser({
            ...firebaseUser,
            firebaseUid,              // convenience
            role: backendUser.role,   // "admin" or "member"
            backendId: backendUser._id,
            backend: backendUser,
          });
        } else {
          // fallback if sync somehow failed but Firebase login worked
          setUser({
            ...firebaseUser,
            firebaseUid,
            role: "member",
          });
        }
      } catch (err) {
        console.error("AuthContext backend user fetch error", err);
        setUser({
          ...firebaseUser,
          firebaseUid,
          role: "member",
        });
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
