import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { defaultPages, type ContentPage } from "../content/pageTemplates";

const STORAGE_KEY = "editable-pages";

const loadPages = (): ContentPage[] => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return defaultPages;
  }

  try {
    return JSON.parse(saved) as ContentPage[];
  } catch {
    return defaultPages;
  }
};

export default function ContentEditor() {
  const toast = useToast();
  const [pages, setPages] = useState<ContentPage[]>(loadPages());

  const firstPage = useMemo(() => pages[0], [pages]);
  const [title, setTitle] = useState(firstPage?.title ?? "");
  const [description, setDescription] = useState(firstPage?.description ?? "");

  if (!firstPage) {
    return null;
  }

  const handleSave = () => {
    const updated = pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            title,
            description,
          }
        : page,
    );

    setPages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    toast({
      title: "Content saved",
      description: "Your editable page content is updated in local storage.",
      status: "success",
      duration: 2200,
      isClosable: true,
    });
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPages(defaultPages);
    setTitle(defaultPages[0]?.title ?? "");
    setDescription(defaultPages[0]?.description ?? "");
  };

  return (
    <Box p={{ base: 6, md: 10 }} color="white" minH="100vh" bg="#0e0a1e">
      <VStack maxW="760px" mx="auto" align="start" spacing={5}>
        <Heading>Content Editor</Heading>
        <Text color="gray.300">
          Quick editor for the first custom page. Wire this save action to your backend later.
        </Text>

        <FormControl>
          <FormLabel>Page Title</FormLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormControl>

        <FormControl>
          <FormLabel>Page Description</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormControl>

        <Box display="flex" gap={3}>
          <Button onClick={handleSave} colorScheme="purple">
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset Defaults
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
