"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "@/styles/MovieCard.css";
import Link from "next/link";
import Image from "next/image";
import est from "@/public/est.png";
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
export default function AddShowPage() {
  const [formData, setFormData] = useState({
    title: "",
    season: "",
    episode: "",
    start_date: "",
    end_date: "",
    genre: "",
    link: "",
    status: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "season" || name === "episode" ? Number(value) : value,
    }));
  };

  const AddShow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const {
      title,
      season,
      episode,
      start_date,
      end_date,
      genre,
      link,
      status,
    } = formData;

    const randomId = Math.floor(Math.random() * 1_000_000) + 1;

    const { error } = await supabase.from("est").insert([
      {
        id: randomId,
        title,
        season,
        episode,
        start_date,
        end_date,
        genre,
        link,
        status,
      },
    ]);

    if (error) {
      throw new Error("Error adding movie: " + error.message);
    }
    // Optionally reset form
    setFormData({
      title: "",
      season: "",
      episode: "",
      start_date: "",
      end_date: "",
      genre: "",
      link: "",
      status: "",
    });
  };

  return (
    <>
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
        <h2>Add a Movie</h2>
        <form onSubmit={AddShow}>
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="season"
            placeholder="Season"
            value={formData.season}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="episode"
            placeholder="Episode"
            value={formData.episode}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="start_date"
            placeholder="Start Date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="genre"
            placeholder="Genre"
            value={formData.genre}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="link"
            placeholder="Link"
            value={formData.link}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="status"
            placeholder="Status"
            value={formData.status}
            onChange={handleChange}
            required
          />
          <button type="submit">Submit</button>
        </form>
      </main>
    </>
  );
}
