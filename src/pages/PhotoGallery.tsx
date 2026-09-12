import { Box, Container, Heading, Link, Text, VStack } from "@chakra-ui/react";
import FanPhoto from "../components/FanPhoto";
import PhotoJournal from "../components/PhotoJournal";
import { heroPhoto, photographer } from "../content/grantsor";

export default function PhotoGallery() {
  return (
    <Box as="main" minH="100vh" bg="#0e0a1e" color="white">
      <Container maxW="1200px" py={{ base: 8, md: 12 }}>
        <VStack align="start" spacing={3} mb={8}>
          <Text className="eyebrow">IVE FAN PHOTOGRAPHY</Text>
          <Heading as="h1" fontSize={{ base: "3xl", md: "4xl" }}>
            Fan photo gallery
          </Heading>
          <Text color="whiteAlpha.800" maxW="720px">
            IVE moments through a fellow DIVE’s lens. Photos by{" "}
            <Link href={photographer.profileUrl} color="purple.200" isExternal>
              @{photographer.name}
            </Link>
            , shared with permission for this non-commercial fan project.
          </Text>
        </VStack>

        <Box
          as="figure"
          m={0}
          mb={10}
          maxW="760px"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="xl"
          overflow="hidden"
          bg="#1A1630"
        >
          <FanPhoto
            photo={heroPhoto}
            priority
            sizes="(max-width: 767px) 95vw, (max-width: 1100px) 70vw, 760px"
          />
          <Box as="figcaption" p={{ base: 4, md: 5 }}>
            <Heading as="h2" fontSize="lg">
              {heroPhoto.title}
            </Heading>
            <Text color="whiteAlpha.700" fontSize="sm" mt={1}>
              IVE Switch Manila fansign · July 12, 2024
            </Text>
            <Link
              href={heroPhoto.postUrl}
              isExternal
              display="inline-block"
              mt={3}
              fontSize="sm"
              color="purple.200"
            >
              Photo © {photographer.name} · Original post ↗︎
            </Link>
          </Box>
        </Box>

        <PhotoJournal />
      </Container>
    </Box>
  );
}
