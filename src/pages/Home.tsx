import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import MemberUniverseSection from "../components/MemberUniverseSection";
import { getMemberProfiles, loadMemberProfiles } from "../services/memberProfileStore";
import type { MemberProfile } from "../types/member";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [membersData, setMembersData] = useState<MemberProfile[]>(() => loadMemberProfiles());
  const [scrollY, setScrollY] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    void (async () => {
      const profiles = await getMemberProfiles();
      setMembersData(profiles);
    })();

    const handleScroll = () => setScrollY(window.scrollY);
    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      setPointer({ x, y });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  const cameraTransform = useMemo(() => {
    const rotateX = pointer.y * -6;
    const rotateY = pointer.x * 9;
    const translateY = scrollY * -0.08;
    return `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`;
  }, [pointer, scrollY]);

  return (
    <Box className="home-page" minH="100vh" color="white">
      <Box className="parallax-layer layer-back" style={{ transform: `translateY(${scrollY * 0.14}px)` }} />
      <Box className="parallax-layer layer-mid" style={{ transform: `translateY(${scrollY * 0.22}px)` }} />
      <Box className="parallax-layer layer-front" style={{ transform: `translateY(${scrollY * 0.32}px)` }} />

      <Container maxW="1200px" py={{ base: 12, md: 20 }} position="relative" zIndex={2}>
        {/* <VStack spacing={6} textAlign="center" mb={{ base: 12, md: 16 }}>
          <Text className="eyebrow">Level 1 — Modern interactive site</Text>
          <Heading fontSize={{ base: "3xl", md: "6xl" }} lineHeight="1.1">
            IVE Neon Dimension
          </Heading>
          <Text maxW="740px" color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }}>
            Parallax depth, smooth motion, and 3D-like cards are now built into the homepage. Move your pointer and
            scroll to feel each layer react.
          </Text>
        </VStack>

        <Grid templateColumns={{ base: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }} gap={{ base: 5, md: 8 }}>
          {membersData.map((member, index) => (
            <Box
              key={member.id}
              className="member-card"
              style={{
                animationDelay: `${index * 80}ms`,
                transform: `translateZ(${(index % 3) * 12 + 6}px) rotateX(${pointer.y * -2.8}deg) rotateY(${pointer.x * 3.2}deg)`,
              }}
            >
              <Image src={member.photoUrl} alt={member.name} w="100%" h="340px" objectFit="cover" />
              <VStack py={4} px={4} bg="rgba(12,11,24,0.86)" spacing={3}>
                <Text fontWeight="bold" fontSize="lg">
                  {member.name}
                </Text>
                <Text color="purple.200" fontSize="sm" textAlign="center">
                  {member.tagline}
                </Text>
                <HStack spacing={3}>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={() => navigate(`/member/${member.id}`)}
                  >
                    View Profile
                  </Button>
                  {role === "Admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="pink"
                      onClick={() => navigate(`/member/${member.id}?edit=1`)}
                    >
                      Edit
                    </Button>
                  )}
                </HStack>
              </VStack>
            </Box>
          ))}
        </Grid> */}

        <MemberUniverseSection
          members={membersData}
          onSelectMember={(memberId) => navigate(`/member/${memberId}`)}
        />
      </Container>

      <Box className="world-section" style={{ transform: cameraTransform }}>
        <Container maxW="1200px" py={{ base: 12, md: 20 }}>
          {/* <VStack spacing={5} align="start" mb={10}>
            <Text className="eyebrow">Level 2 — Full 3D website</Text>
            <Heading fontSize={{ base: "2xl", md: "4xl" }}>Scroll through a 3D world concept</Heading>
            <Text color="whiteAlpha.800" maxW="760px">
              This section simulates camera motion in a 3D corridor. Next step can swap these blocks with real glTF
              models and a true WebGL scene.
            </Text>
          </VStack> */}

          {/* <HStack className="world-track" spacing={6} align="stretch">
            <Box className="world-node">
              <Heading size="md" mb={2}>
                Camera Move
              </Heading>
              <Text color="whiteAlpha.800">The corridor tilts with pointer movement and drifts with scroll depth.</Text>
            </Box>
            <Box className="world-node">
              <Heading size="md" mb={2}>
                Interactive Objects
              </Heading>
              <Text color="whiteAlpha.800">Cards and nodes keep subtle 3D rotations for a tactile feel.</Text>
            </Box>
            <Box className="world-node">
              <Heading size="md" mb={2}>
                Ready for 3D Models
              </Heading>
              <Text color="whiteAlpha.800">We can wire in your photos/textures as model materials next.</Text>
            </Box>
          </HStack> */}

          <Button mt={10} colorScheme="purple" size="lg" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
