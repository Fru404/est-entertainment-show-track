"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import "@/styles/SignIn.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  // Track auth session
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) setSession(data.session);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login error: " + error.message);
    } else {
      alert("Signed in!");
      router.push("/"); // Redirect to home page after sign in
    }
  };

  // Sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Signup error: " + error.message);
    } else {
      alert("Signed up! Check your email for confirmation.");
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <main>
      {session ? (
        <div className="welcome-container">
          <h2>Welcome, {session.user.email}</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="auth-form">
          <h2>Sign In / Sign Up</h2>
          <div className="form-row">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-row">
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit">Sign In</button>
            <button type="button" onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
