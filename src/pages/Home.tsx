import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Heading, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { getMemberProfiles, loadMemberProfiles } from "../services/memberProfileStore";
import type { MemberProfile } from "../types/member";
import ResponsiveMemberImage from "../components/ResponsiveMemberImage";
import { usePerformancePreferences } from "../hooks/usePerformancePreferences";

const MemberUniverseSection = lazy(() => import("../components/MemberUniverseSection"));

const Home: React.FC = () => {
  const navigate = useNavigate();
  const universeRef = useRef<HTMLDivElement | null>(null);
  const [membersData, setMembersData] = useState<MemberProfile[]>(() => loadMemberProfiles());
  const [scrollY, setScrollY] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [loadUniverse, setLoadUniverse] = useState(false);
  const { prefersReducedMotion, prefersReducedData } = usePerformancePreferences();
  const allowImmersiveMotion = !prefersReducedMotion && !prefersReducedData;

  useEffect(() => {
    void (async () => {
      const profiles = await getMemberProfiles();
      setMembersData(profiles);
    })();

  }, []);

  useEffect(() => {
    if (!allowImmersiveMotion) {
      setScrollY(0);
      setPointer({ x: 0, y: 0 });
      return;
    }

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
  }, [allowImmersiveMotion]);

  useEffect(() => {
    const target = universeRef.current;
    if (!target || loadUniverse || !allowImmersiveMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadUniverse(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [allowImmersiveMotion, loadUniverse]);

  const cameraTransform = useMemo(() => {
    if (!allowImmersiveMotion) return "none";

    const rotateX = pointer.y * -6;
    const rotateY = pointer.x * 9;
    const translateY = scrollY * -0.08;
    return `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px)`;
  }, [allowImmersiveMotion, pointer, scrollY]);

  const featuredMembers = useMemo(() => membersData.slice(0, 6), [membersData]);

  const scrollToUniverse = () => {
    universeRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <Box className="home-page" minH="100vh" color="white">
      <Box className="parallax-layer layer-back" style={{ transform: `translateY(${scrollY * 0.14}px)` }} />
      <Box className="parallax-layer layer-mid" style={{ transform: `translateY(${scrollY * 0.22}px)` }} />
      <Box className="parallax-layer layer-front" style={{ transform: `translateY(${scrollY * 0.32}px)` }} />

      <Container maxW="1200px" py={{ base: 12, md: 20 }} position="relative" zIndex={2}>
        <Box className="home-hero">
          <VStack className="home-hero-copy" align="start" spacing={6}>
            <Text className="eyebrow">Non-commercial IVE fan-support space</Text>
            <Heading as="h1" className="home-hero-title">
              IVE PH Fan Universe
            </Heading>
            <Text className="home-hero-body">
              A polished fan-built hub for exploring IVE member profiles, YouTube momentum,
              daily quizzes, and immersive 3D-inspired fan moments.
            </Text>

            <HStack className="home-hero-actions" spacing={3}>
              <Button size="lg" colorScheme="purple" onClick={scrollToUniverse}>
                Enter Universe
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                View Metrics
              </Button>
            </HStack>

            <HStack className="fan-signal-row" spacing={3}>
              <Box className="fan-signal">
                <Text>Members</Text>
                <strong>{membersData.length}</strong>
              </Box>
              <Box className="fan-signal">
                <Text>Mode</Text>
                <strong>Fan-built</strong>
              </Box>
              <Box className="fan-signal">
                <Text>Experience</Text>
                <strong>Interactive</strong>
              </Box>
            </HStack>
          </VStack>

          <Box className="hero-stage" aria-label="IVE member spotlight">
            {featuredMembers.map((member, index) => (
              <button
                key={member.id}
                className={`hero-polaroid hero-polaroid-${index}`}
                type="button"
                onClick={() => navigate(`/member/${member.id}`)}
              >
                <ResponsiveMemberImage
                  src={member.photoUrl || member.backupPhotoUrl}
                  alt={member.name}
                  sizes="(max-width: 560px) 118px, 178px"
                  style={{ objectPosition: `${member.photoObjectPositionX ?? 50}% ${member.photoObjectPositionY ?? 50}%` }}
                />
                <span>{member.name}</span>
              </button>
            ))}
          </Box>
        </Box>

        <Box className="fan-disclaimer">
          <Text>
            This is a fan-support website. It is not affiliated with IVE, Starship Entertainment, or any official merch project.
          </Text>
        </Box>

        <Box ref={universeRef}>
          {!allowImmersiveMotion ? (
            <Box
              mt={{ base: 14, md: 20 }}
              borderRadius="2xl"
              border="1px solid"
              borderColor="whiteAlpha.300"
              bg="rgba(11, 6, 24, 0.92)"
              p={{ base: 6, md: 10 }}
            >
              <VStack spacing={3} textAlign="center" mb={8}>
                <Text className="eyebrow">IVE MEMBER GALLERY</Text>
                <Heading fontSize={{ base: "2xl", md: "4xl" }}>A lighter way to explore</Heading>
                <Text maxW="680px" color="whiteAlpha.800">
                  Your motion or data-saving preference is active, so the full 3D orbit stays paused.
                </Text>
              </VStack>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
                {featuredMembers.map((member) => (
                  <Box
                    as="button"
                    type="button"
                    key={member.id}
                    textAlign="left"
                    borderRadius="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    bg="whiteAlpha.100"
                    onClick={() => navigate(`/member/${member.id}`)}
                    _focusVisible={{ outline: "3px solid", outlineColor: "purple.300" }}
                  >
                    <ResponsiveMemberImage
                      src={member.photoUrl || member.backupPhotoUrl}
                      alt={member.name}
                      sizes="(max-width: 768px) 50vw, 180px"
                      style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover" }}
                    />
                    <Text px={3} py={2} fontWeight="bold">{member.name}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          ) : loadUniverse ? (
            <Suspense
              fallback={
                <Box minH="460px" display="grid" placeItems="center">
                  <Text color="whiteAlpha.800">Loading 3D universe...</Text>
                </Box>
              }
            >
              <MemberUniverseSection
                members={membersData}
                onSelectMember={(memberId) => navigate(`/member/${memberId}`)}
              />
            </Suspense>
          ) : (
            <Box minH="460px" display="grid" placeItems="center">
              <Text color="whiteAlpha.800">3D universe loads when it enters view.</Text>
            </Box>
          )}
        </Box>
      </Container>

      <Box className="world-section" style={{ transform: cameraTransform }}>
        <Container maxW="1200px" py={{ base: 12, md: 20 }}>
          <VStack spacing={5} align="start" mb={10}>
            <Text className="eyebrow">IVE PH EXPERIENCE</Text>
            <Heading fontSize={{ base: "2xl", md: "4xl" }}>
              Dive into IVE's world
            </Heading>
            <Text color="whiteAlpha.800" maxW="760px">
              A fan-built interactive space inspired by IVE - blending motion, visuals, and creativity.
              This evolving experience will soon feature real 3D environments and deeper immersion for fans.
            </Text>
          </VStack>

          <HStack className="world-track" spacing={6} align="stretch">
            <Box className="world-node">
              <Heading size="md" mb={2}>
                Dynamic Motion
              </Heading>
              <Text color="whiteAlpha.800">
                The environment responds fluidly to your movement - shifting perspective as you scroll and explore.
              </Text>
            </Box>

            <Box className="world-node">
              <Heading size="md" mb={2}>
                Immersive Interaction
              </Heading>
              <Text color="whiteAlpha.800">
                Elements subtly react in 3D space, creating a tactile and engaging browsing experience.
              </Text>
            </Box>

            <Box className="world-node">
              <Heading size="md" mb={2}>
                Evolving Experience
              </Heading>
              <Text color="whiteAlpha.800">
                Designed to grow into a fully realized 3D world with custom models, visuals, and deeper immersion.
              </Text>
            </Box>
          </HStack>

          <Button
            mt={10}
            colorScheme="purple"
            size="lg"
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })}
          >
            Back to top
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
