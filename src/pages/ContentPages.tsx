import { useEffect, useState } from "react";
import { Badge, Box, Button, Heading, Image, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { ContentPage } from "../content/pageTemplates";
import { defaultPages } from "../content/pageTemplates";
import { contentApi } from "../services/api/contentApi";

export default function ContentPages() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setPages(await contentApi.getPublishedPages());
      } catch {
        setPages(defaultPages.filter((page) => page.isPublished));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box p={{ base: 5, md: 10 }} color="white" minH="100vh" bg="linear-gradient(135deg, #080612, #161127 55%, #241336)">
      <VStack align="start" spacing={6} maxW="1120px" mx="auto">
        <Box>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            Published content
          </Text>
          <Heading mt={2}>Editable Pages</Heading>
          <Text color="whiteAlpha.800" mt={2}>
            Backend-controlled pages for fan project announcements, rules, guides, and image-rich stories.
          </Text>
        </Box>

        {loading ? (
          <VStack py={10} w="100%">
            <Spinner color="purple.300" />
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
            {pages.map((page) => (
              <Box key={page.slug} overflow="hidden" borderRadius="lg" bg="rgba(255,255,255,0.08)" border="1px solid" borderColor="whiteAlpha.300">
                {page.heroImageUrl && (
                  <Image src={page.heroImageUrl} alt={page.title} h="190px" w="100%" objectFit="cover" />
                )}
                <Box p={5}>
                  <Badge colorScheme="purple" mb={3}>{page.slug}</Badge>
                  <Heading size="md" mb={2}>
                    {page.title}
                  </Heading>
                  <Text mb={4} color="whiteAlpha.800">
                    {page.description}
                  </Text>
                  <Button as={RouterLink} to={`/pages/${page.slug}`} colorScheme="purple">
                    Open Page
                  </Button>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
}
