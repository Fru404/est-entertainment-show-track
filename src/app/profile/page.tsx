"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import { Session } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
      } else {
        setSession(session);
      }
      setLoading(false);
    };

    loadSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const { error } = await supabase.from("user-data").insert([
      {
        username: name,
        email: session.user.email,
      },
    ]);

    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      alert("Profile saved!");
      router.push("/");
    }
  };

  const handleDeleteAccount = async () => {
    if (!session) return;

    const confirmed = confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );
    if (!confirmed) return;

    // Step 2: Call secure API to delete user from auth.users
    const res = await fetch("/api/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: session.user.id }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Failed to delete auth account: " + data.error);
      return;
    }

    // Step 3: Sign out and redirect
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Username:</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Save Profile
        </button>
      </form>

      <hr style={{ margin: "2rem 0" }} />

      <section>
        <h3>Danger Zone</h3>
        <button
          onClick={handleDeleteAccount}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Delete Account
        </button>
      </section>
    </main>
  );
}
