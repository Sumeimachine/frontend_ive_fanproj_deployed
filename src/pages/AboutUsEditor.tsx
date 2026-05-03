import { useState } from "react";
import { Box, Button, FormControl, FormLabel, Heading, Text, Textarea, VStack, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const ABOUT_US_STORAGE_KEY = "about-us-content";
const DEFAULT_ABOUT_CONTENT = `made and managed by @Sumeimachan|@jk_anyj|

Dive Into IVE is a fan-powered space where members can explore profiles, play quizzes, track points, and join special community events.

This project is built by fans for fans and is designed to be reusable for seasonal events, promotions, and engagement campaigns.

Dev is in a midlife crisis and adding features at 3AM
we need content mods before things get out of hand 💀
apply by sending a message/reply to @Sumeimachan|@jk_anyj|`;

const loadAboutContent = () => localStorage.getItem(ABOUT_US_STORAGE_KEY) ?? DEFAULT_ABOUT_CONTENT;

export default function AboutUsEditor() {
  const navigate = useNavigate();
  const toast = useToast();
  const [content, setContent] = useState(loadAboutContent);

  const handleSave = () => {
    localStorage.setItem(ABOUT_US_STORAGE_KEY, content);

    toast({
      title: "About Us updated",
      description: "Changes were saved successfully.",
      status: "success",
      duration: 2200,
      isClosable: true,
    });
  };

  const handleReset = () => {
    setContent(DEFAULT_ABOUT_CONTENT);
    localStorage.removeItem(ABOUT_US_STORAGE_KEY);
  };

  return (
    <Box p={{ base: 6, md: 10 }} color="white" minH="100vh" bg="#0e0a1e">
      <VStack maxW="900px" mx="auto" align="start" spacing={5}>
        <Heading>About Us Editor</Heading>
        <Text color="gray.300">Admin and super-admin can edit this section.</Text>

        <FormControl>
          <FormLabel>About Us Content</FormLabel>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} minH="320px" />
        </FormControl>

        <Box display="flex" gap={3} flexWrap="wrap">
          <Button onClick={handleSave} colorScheme="purple">
            Save Changes
          </Button>
          <Button variant="outline" colorScheme="orange" onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button variant="ghost" onClick={() => navigate("/about")}>Go to About Us</Button>
        </Box>
      </VStack>
    </Box>
  );
}
