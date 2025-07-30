"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";

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

export default function PublicWatchListPage() {
  const { username } = useParams();
  const [movies, setMovies] = useState<MovieWithTimer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchMovies(username as string);
  }, [username]);

  const fetchMovies = async (user: string) => {
    setLoading(true);

    const { data: watchlistIds, error: watchlistError } = await supabase
      .from("watch-list")
      .select("id")
      .eq("username", user);

    if (watchlistError || !watchlistIds?.length) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const ids = watchlistIds.map((item) => item.id);

    const { data: moviesData, error: moviesError } = await supabase
      .from("est")
      .select("*")
      .in("id", ids);

    if (moviesError || !moviesData) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const enrichedData = moviesData.map((movie) => ({
      ...movie,
      timer: getNextEpisodeCountdown(movie.start_date),
      computedStatus: getEpisodeStatus(movie.start_date, movie.end_date),
    }));

    setMovies(enrichedData);
    setLoading(false);
  };

  return (
    <main>
      <h2 style={{ textAlign: "left", padding: "10px" }}>
        {username} - Watchlist
      </h2>
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading...</p>
      ) : movies.length === 0 ? (
        <p style={{ textAlign: "center" }}>No watchlist items found.</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <h3>{movie.title}</h3>
              <p>Season: {movie.season}</p>
              <p>Episode: {movie.episode}</p>
              <p>Start: {movie.start_date}</p>
              <p>End: {movie.end_date}</p>
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
                    className={`hex-rating ${i < movie.rating ? "active" : ""}`}
                  >
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

// Logic functions

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

    return `Next in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else {
    return "Episode airing now or just released.";
  }
}
