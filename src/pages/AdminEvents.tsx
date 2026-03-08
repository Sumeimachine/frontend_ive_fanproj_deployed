import { useState } from "react";
import api from "../services/src/services/api";

export default function AdminEvents() {

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const saveEvent = async () => {
    await api.post("/events", { title, content });
    alert("Event saved");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Create Event</h2>

      <input
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Event description"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={saveEvent}>Save</button>
    </div>
  );
}