import { Box, Button, Heading, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
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

export default function ContentPages() {
  const pages = getPages();

  return (
    <Box p={{ base: 6, md: 10 }} color="white" minH="100vh" bg="#0e0a1e">
      <VStack align="start" spacing={6} maxW="960px" mx="auto">
        <Heading>Editable Pages</Heading>
        <Text color="gray.300">
          These pages are template-driven and can be edited from the Content Editor.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
          {pages.map((page) => (
            <Box key={page.slug} p={5} borderRadius="xl" bg="whiteAlpha.100">
              <Heading size="md" mb={2}>
                {page.title}
              </Heading>
              <Text mb={4} color="gray.300">
                {page.description}
              </Text>
              <Button as={RouterLink} to={`/pages/${page.slug}`} colorScheme="purple">
                Open Page
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
