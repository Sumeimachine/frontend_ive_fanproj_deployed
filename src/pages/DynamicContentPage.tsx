import { useEffect, useState } from "react";
import { Box, Button, Heading, Image, SimpleGrid, Spinner, Text, VStack } from "@chakra-ui/react";
import { Link as RouterLink, useParams } from "react-router-dom";
import type { ContentPage, PageSection } from "../content/pageTemplates";
import { defaultPages } from "../content/pageTemplates";
import { contentApi } from "../services/api/contentApi";

export default function DynamicContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    void (async () => {
      try {
        setPage(await contentApi.getPublishedPage(slug));
      } catch {
        setPage(defaultPages.find((item) => item.slug === slug && item.isPublished) ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <Box p={10} color="white" bg="#0e0a1e" minH="100vh">
        <Spinner color="purple.300" />
      </Box>
    );
  }

  if (!page) {
    return (
      <Box p={10} color="white" bg="#0e0a1e" minH="100vh">
        <Heading size="md">Page not found</Heading>
      </Box>
    );
  }

  return <ContentPageView page={page} />;
}

export function ContentPageView({ page }: { page: ContentPage }) {
  return (
    <Box color="white" minH="100vh" bg="#080612">
      <Box
        minH={{ base: "420px", md: "520px" }}
        px={{ base: 5, md: 10 }}
        py={{ base: 12, md: 18 }}
        display="flex"
        alignItems="end"
        bgImage={
          page.heroImageUrl
            ? `linear-gradient(180deg, rgba(8,6,18,0.24), rgba(8,6,18,0.94)), url(${page.heroImageUrl})`
            : "linear-gradient(135deg, #080612, #201236 70%, #3a1742)"
        }
        bgSize="cover"
        bgPos="center"
      >
        <VStack align="start" spacing={4} maxW="920px">
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            {page.slug}
          </Text>
          <Heading size="2xl">{page.title}</Heading>
          <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "xl" }} maxW="760px">
            {page.description}
          </Text>
          {page.ctaLabel && page.ctaUrl && (
            <Button as={RouterLink} to={page.ctaUrl} colorScheme="purple">
              {page.ctaLabel}
            </Button>
          )}
        </VStack>
      </Box>

      <VStack align="stretch" spacing={5} maxW="1060px" mx="auto" px={{ base: 5, md: 10 }} py={10}>
        {page.sections
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((section) => (
            <ContentSection key={section.id} section={section} />
          ))}
      </VStack>
    </Box>
  );
}

function ContentSection({ section }: { section: PageSection }) {
  const hasImage = !!section.imageUrl;
  const image = hasImage ? (
    <Image src={section.imageUrl ?? ""} alt={section.title} w="100%" h={{ base: "220px", md: "280px" }} objectFit="cover" borderRadius="lg" />
  ) : null;

  const text = (
    <Box>
      <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.12em">
        Section {section.sortOrder}
      </Text>
      <Heading size={section.layout === "feature" ? "lg" : "md"} mt={2} mb={3}>
        {section.title}
      </Heading>
      <Text color="whiteAlpha.900" whiteSpace="pre-wrap" lineHeight="1.8">
        {section.body}
      </Text>
    </Box>
  );

  if (section.layout === "feature") {
    return (
      <Box borderRadius="lg" border="1px solid" borderColor="pink.300" bg="rgba(255, 92, 164, 0.12)" p={{ base: 5, md: 7 }}>
        {hasImage && <Box mb={5}>{image}</Box>}
        {text}
      </Box>
    );
  }

  if (hasImage && section.layout !== "text") {
    const imageFirst = section.layout === "image-left";
    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} alignItems="center" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={{ base: 4, md: 6 }}>
        {imageFirst ? image : text}
        {imageFirst ? text : image}
      </SimpleGrid>
    );
  }

  return (
    <Box borderRadius="lg" bg="rgba(255,255,255,0.07)" border="1px solid" borderColor="whiteAlpha.200" p={{ base: 5, md: 6 }}>
      {text}
    </Box>
  );
}
