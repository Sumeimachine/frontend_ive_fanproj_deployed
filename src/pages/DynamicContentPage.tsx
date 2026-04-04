import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { defaultPages, type ContentPage } from "../content/pageTemplates";

const STORAGE_KEY = "editable-pages";

const getPages = (): ContentPage[] => {
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

export default function DynamicContentPage() {
  const { slug } = useParams<{ slug: string }>();

  const page = useMemo(() => getPages().find((item) => item.slug === slug), [slug]);

  if (!page) {
    return (
      <Box p={10} color="white" bg="#0e0a1e" minH="100vh">
        <Heading size="md">Page not found</Heading>
      </Box>
    );
  }

  return (
    <Box p={{ base: 6, md: 10 }} color="white" minH="100vh" bg="#0e0a1e">
      <VStack align="start" spacing={5} maxW="900px" mx="auto">
        <Heading>{page.title}</Heading>
        <Text color="gray.300">{page.description}</Text>

        {page.sections.map((section) => (
          <Box key={section.id} p={5} bg="whiteAlpha.100" borderRadius="xl" w="100%">
            <Heading size="md" mb={2}>
              {section.title}
            </Heading>
            <Text color="gray.200">{section.body}</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
