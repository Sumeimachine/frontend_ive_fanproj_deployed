import { useEffect, useMemo, useState } from "react";
import { Box, Button, Heading, Textarea, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ABOUT_US_STORAGE_KEY = "about-us-content";
const DEFAULT_ABOUT_CONTENT = `made and managed by @Sumeimachan|@jk_anyj|

Dive Into IVE is a fan-powered space where members can explore profiles, play quizzes, track points, and join special community events.

This project is built by fans for fans and is designed to be reusable for seasonal events, promotions, and engagement campaigns.

Dev is in a midlife crisis and adding features at 3AM
we need content mods before things get out of hand 💀
apply by sending a message/reply to @Sumeimachan|@jk_anyj|`;

export default function AboutUs() {
  const { role } = useAuth();
  const [aboutContent, setAboutContent] = useState(DEFAULT_ABOUT_CONTENT);
  const canEdit = useMemo(() => role === "Admin" || role === "Super-Admin", [role]);

  useEffect(() => {
    const savedContent = localStorage.getItem(ABOUT_US_STORAGE_KEY);
    if (savedContent) {
      setAboutContent(savedContent);
    }
  }, []);

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={4} maxW="900px">
        <Heading size="lg" color="white">About Us</Heading>
        <Textarea value={aboutContent} isReadOnly minH="300px" color="whiteAlpha.900" resize="vertical" />
        {canEdit && (
          <Button as={RouterLink} to="/about/edit" colorScheme="purple" w="fit-content">
            Edit About Us
          </Button>
        )}
      </VStack>
    </Box>
  );
}
