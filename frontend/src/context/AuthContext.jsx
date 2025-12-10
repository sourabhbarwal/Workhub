// // frontend/src/context/AuthContext.jsx
// import { createContext, useContext, useEffect, useState } from "react";
// import { auth } from "../firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { api } from "../api";


// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (!firebaseUser) {
//         // setUser({
//         //   uid: firebaseUser.uid,
//         //   email: firebaseUser.email,
//         //   name: firebaseUser.displayName,
//         // });
//         setUser(null);
//         setLoading(false);
//         return;
//       } 
//       try {
//         const res=await api.get("/users/byUid", {
//           params: {firebaseUid:firebaseUser.uid},
//         });
//         const backendUser = res.data;
//         setUser({
//           ...firebaseUser,
//           role: backendUser.role,
//           teamId: backendUser.teamId || null,
//           backend: backendUser,
//         });
//       } catch(err){
//         console.error("Authcontext backend user fetch error", err);
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

// export function useAuth() {
//   return useContext(AuthContext);
// }

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

      try {
        const res = await api.get("/users/byUid", {
          params: { firebaseUid: firebaseUser.uid },
        });
        const backendUser = res.data;

        // 🔥 This is what Layout reads
        setUser({
          ...firebaseUser,
          role: backendUser.role,
          backendId: backendUser._id,
          backend: backendUser,
        });
      } catch (err) {
        console.error("AuthContext backend user fetch error", err);
        // fallback – at least set firebase user, but with no role
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
