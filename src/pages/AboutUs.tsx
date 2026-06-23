import { useEffect, useMemo, useState } from "react";
import { Box, Button, Heading, Spinner } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { ContentPage } from "../content/pageTemplates";
import { defaultPages } from "../content/pageTemplates";
import { useAuth } from "../context/AuthContext";
import { contentApi } from "../services/api/contentApi";
import { ContentPageView } from "./DynamicContentPage";

export default function AboutUs() {
  const { role } = useAuth();
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const canEdit = useMemo(() => role === "Admin" || role === "Super-Admin", [role]);

  useEffect(() => {
    void (async () => {
      try {
        setPage(await contentApi.getPublishedPage("about"));
      } catch {
        setPage(defaultPages.find((item) => item.slug === "about") ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <Heading size="md">About content is not published.</Heading>
      </Box>
    );
  }

  return (
    <Box position="relative">
      {canEdit && (
        <Button as={RouterLink} to="/pages/editor?slug=about" colorScheme="purple" position="absolute" top={5} right={5} zIndex={2}>
          Edit About
        </Button>
      )}
      <ContentPageView page={page} />
    </Box>
  );
}
