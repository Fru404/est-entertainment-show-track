"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import "@/styles/WatchList.css";
import Image from "next/image";
import est from "@/public/est.png";
import Link from "next/link";
import { FaTrash } from "react-icons/fa";
import { Session } from "@supabase/supabase-js"; // ✅ FIX

type Movie = {
  id: number;
  title: string;
  season: number;
  episode: number;
  start_date: string;
  end_date: string;
  genre: string;
  link: string;
  status: string;
  rating: number;
};

type MovieWithTimer = Movie & {
  timer: string;
  computedStatus: string;
};

export default function WatchListPage() {
  const [movies, setMovies] = useState<MovieWithTimer[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ username: string } | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Get session and subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile after session is set
  useEffect(() => {
    if (!session) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("user-data")
        .select("username")
        .eq("email", session.user.email)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        console.error("Error fetching profile:", error?.message);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session]);

  // Fetch movies after profile is loaded
  useEffect(() => {
    if (!hasMounted || !profile) return;
    fetchMovies();
  }, [hasMounted, profile]);

  // Timer updater
  useEffect(() => {
    if (!hasMounted || movies.length === 0) return;

    const interval = setInterval(() => {
      setMovies((prevMovies) =>
        prevMovies.map((movie) => ({
          ...movie,
          timer: getNextEpisodeCountdown(movie.start_date),
          computedStatus: getEpisodeStatus(movie.start_date, movie.end_date),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [hasMounted, movies.length]);

  async function fetchMovies() {
    setLoading(true);

    if (!profile?.username) {
      console.warn("Username not loaded yet.");
      setLoading(false);
      return;
    }

    // Get movie IDs from watch-list for current user
    const { data: watchlistIds, error: watchlistError } = await supabase
      .from("watch-list")
      .select("id")
      .eq("username", profile.username);

    if (watchlistError) {
      console.error("Failed to fetch watchlist IDs:", watchlistError);
      setLoading(false);
      return;
    }

    const ids = watchlistIds?.map((item) => item.id) || [];

    if (ids.length === 0) {
      setMovies([]);
      setLoading(false);
      return;
    }

    // Fetch actual movie data
    const { data: moviesData, error: moviesError } = await supabase
      .from("est")
      .select("*")
      .in("id", ids);

    if (moviesError) {
      console.error("Failed to fetch movies:", moviesError);
      setLoading(false);
      return;
    }

    const enrichedData = (moviesData || []).map((movie) => ({
      ...movie,
      timer: getNextEpisodeCountdown(movie.start_date),
      computedStatus: getEpisodeStatus(movie.start_date, movie.end_date),
    }));

    setMovies(enrichedData);
    setLoading(false);
  }

  async function handleRating(movieId: number, rating: number) {
    const { error } = await supabase
      .from("est")
      .update({ rating })
      .eq("id", movieId);

    if (!error) {
      setMovies((prevMovies) =>
        prevMovies.map((movie) =>
          movie.id === movieId ? { ...movie, rating } : movie
        )
      );
    } else {
      console.error("Failed to update rating:", error.message);
    }
  }

  async function removeFromWatchlist(movieId: number) {
    const { error } = await supabase
      .from("watch-list")
      .delete()
      .eq("id", movieId)
      .eq("username", profile?.username); // optional safety

    if (error) {
      alert("Failed to remove from watchlist: " + error.message);
      return;
    }

    setMovies((prevMovies) =>
      prevMovies.filter((movie) => movie.id !== movieId)
    );
  }

  return (
    <main>
      <div className="top-bar">
        <div className="top-texts">
          <span>
            <a className="addwatch" href="/add-watch">
              + Add Watch
            </a>
          </span>
          <span>Trending</span>
          <span>New Releases</span>
          <span>Top Rated</span>
          <div style={{ textAlign: "center", margin: "20px" }}>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-container"
            />
          </div>
        </div>
      </div>
      <span>
        <Link href="/">
          <Image
            src={est}
            alt="Logo"
            height={100}
            style={{ cursor: "pointer" }}
          />
        </Link>
      </span>

      <div className="movie-grid">
        {movies.length === 0 ? (
          <p style={{ color: "black" }}>Sign in to view watch-list</p>
        ) : (
          movies
            .filter((movie) =>
              movie.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((movie) => (
              <div key={movie.id} className="movie-card">
                <button
                  className="remove-btn"
                  onClick={() => removeFromWatchlist(movie.id)}
                  title="Remove from watchlist"
                  style={{ cursor: "pointer", color: "red", marginTop: "10px" }}
                >
                  <FaTrash />
                </button>
                <h3>{movie.title}</h3>
                <p>Season: {movie.season}</p>
                <p>Episode: {movie.episode}</p>
                <p>Start Date: {movie.start_date}</p>
                <p>End Date: {movie.end_date}</p>
                <p>Genre: {movie.genre}</p>
                <p>Status: {movie.computedStatus}</p>
                {movie.computedStatus === "Ongoing" && movie.timer && (
                  <p>{movie.timer}</p>
                )}

                <a href={movie.link} target="_blank" rel="noopener noreferrer">
                  More
                </a>

                <div className="rating-container">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`hex-rating clickable ${
                        i < movie.rating ? "active" : ""
                      }`}
                      onClick={() => handleRating(movie.id, i + 1)}
                    >
                      <span>{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </main>
  );
}

// --- Logic Functions ---

function getEpisodeStatus(startDateStr: string, endDateStr: string): string {
  const now = new Date();
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (now < startDate) return "Soon";
  if (now > endDate) return "Finished";
  return "Ongoing";
}

function getNextEpisodeCountdown(startDateStr: string): string {
  const now = new Date();
  const startDate = new Date(startDateStr);
  const msInWeek = 7 * 24 * 60 * 60 * 1000;

  const weeksSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / msInWeek
  );
  const nextEpisodeDate = new Date(
    startDate.getTime() + (weeksSinceStart + 1) * msInWeek
  );

  if (now < nextEpisodeDate) {
    const timeDiff = nextEpisodeDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    return `Next episode in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else {
    return "Episode airing now or just released.";
  }
}
