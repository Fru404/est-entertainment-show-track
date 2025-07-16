"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import Image from "next/image";
import est from "@/public/est.png";
import Link from "next/link";

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
};

type MovieWithTimer = Movie & {
  timer: string;
  computedStatus: string;
};

export default function Home() {
  const [movies, setMovies] = useState<MovieWithTimer[]>([]);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMovies((prevMovies) =>
        prevMovies.map((movie) => ({
          ...movie,
          timer: getNextEpisodeCountdown(movie.start_date),
          computedStatus: getEpisodeStatus(movie.start_date, movie.end_date),
        }))
      );
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [movies.length]);

  async function fetchMovies() {
    const { data, error } = await supabase.from("est").select("*");
    if (data === null || error) {
      setMovies([]);
      return;
    }

    // Add timer and status to each movie
    const enrichedData = data.map((movie) => ({
      ...movie,
      timer: getNextEpisodeCountdown(movie.start_date),
      computedStatus: getEpisodeStatus(movie.start_date, movie.end_date),
    }));

    setMovies(enrichedData);
  }

  return (
    <main>
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
      <button>
        <a href="/add-watch">Add watch</a>
      </button>
      <div className="movie-grid">
        {movies.length === 0 ? (
          <p>No movies found.</p>
        ) : (
          movies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <h3>{movie.title}</h3>
              <p>Season: {movie.season}</p>
              <p>Episode: {movie.episode}</p>
              <p>Start Date: {movie.start_date}</p>
              <p>End Date: {movie.end_date}</p>
              <p>Genre: {movie.genre}</p>
              <p>Status: {movie.computedStatus}</p>
              <p>{movie.computedStatus === "Ongoing" && movie.timer}</p>
              <a href={movie.link} target="_blank" rel="noopener noreferrer">
                More
              </a>
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
