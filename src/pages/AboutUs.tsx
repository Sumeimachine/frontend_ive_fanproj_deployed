import { Box, Heading, Text, VStack } from "@chakra-ui/react";

export default function AboutUs() {
  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={4} maxW="900px">
        <Heading size="lg" color="white">About Us</Heading>
        <Text color="whiteAlpha.900">
          made and managed by @Sumeimachan|@jk_anyj|
        </Text>
        <Text color="whiteAlpha.900">
          Dive Into IVE is a fan-powered space where members can explore profiles, play quizzes,
          track points, and join special community events.
        </Text>
        <Text color="whiteAlpha.800">
          This project is built by fans for fans and is designed to be reusable for seasonal events,
          promotions, and engagement campaigns.
        </Text>

        <Text color="whiteAlpha.800">
              Dev is in a midlife crisis and adding features at 3AM

              we need content mods before things get out of hand 💀

              apply by sending a message/reply to @Sumeimachan|@jk_anyj|
        </Text>
      </VStack>
    </Box>
  );
}
