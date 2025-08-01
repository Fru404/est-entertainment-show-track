import { FaFileExport } from "react-icons/fa";

export default function Home() {
  return (
    <>
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f9f7fb",
        }}
      >
        <h1
          style={{
            color: "#5E386E",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "2rem",
            fontWeight: "600",
          }}
        >
          To come soon <FaFileExport />
        </h1>
      </main>
    </>
  );
}
