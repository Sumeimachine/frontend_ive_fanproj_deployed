import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
} from "@chakra-ui/react";

export default function AdminEvents() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const saveEvent = () => {
    console.log("Event payload", { title, content });
    alert("Hook this action to your backend endpoint for creating events.");
  };

  return (
    <Box style={{ padding: "20px" }}>
      <Heading size="md" mb={4}>
        Create Event
      </Heading>

      <FormControl mb={3}>
        <FormLabel>Event title</FormLabel>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormControl>

      <FormControl mb={3}>
        <FormLabel>Event description</FormLabel>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
      </FormControl>

      <Button onClick={saveEvent}>Save</Button>
    </Box>
  );
}
