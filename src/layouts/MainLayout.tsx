import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Badge, Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { eventApi } from "../services/api/eventApi";
import type { EventReward } from "../types/api";

export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, username, role, currencyBalance, dailyRewardClaimedToday, bootstrapProfile } = useAuth();
  const [activeEventReward, setActiveEventReward] = useState<EventReward | null>(null);
  const [claimingEventReward, setClaimingEventReward] = useState(false);

  const navItems = [
    { label: "Members", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Daily Quiz", to: "/quiz/daily" },
    { label: "Quiz Leaderboards", to: "/quiz/leaderboards" },
    ...((role === "Admin" || role === "Super-Admin")
      ? [
          { label: "Pages", to: "/pages" },
          { label: "Content Editor", to: "/pages/editor" },
          { label: "Quiz Manager", to: "/admin/quizzes" },
          { label: "Media Library", to: "/admin/media" },
        ]
      : []),
    ...(role === "Super-Admin" ? [{ label: "Super Admin", to: "/super-admin/users" }] : []),
    ...(role === "Super-Admin" ? [{ label: "Event Rewards", to: "/super-admin/events" }] : []),
  ];

  useEffect(() => {
    void (async () => {
      try {

const activeEvent = await eventApi.getActiveEventReward();
if ("id" in activeEvent) {
  setActiveEventReward(activeEvent);
} else {
  setActiveEventReward(null);
}
      } catch {
        setActiveEventReward(null);
      }
    })();
  }, []);

  const claimEventReward = async () => {
    if (!activeEventReward) return;

    try {
      setClaimingEventReward(true);
      await eventApi.claimEventReward(activeEventReward.id);
      setActiveEventReward(null);
      await bootstrapProfile();
    } finally {
      setClaimingEventReward(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Box className="dark-shell" display="flex" minH="100vh" bg="#080612">
      <Box
        width="260px"
        bg="#151126"
        color="white"
        p={5}
        display="flex"
        flexDirection="column"
        gap={3}
      >
        <Text fontWeight="bold" fontSize="xl" mb={2}>
          IVE Fan Hub
        </Text>

        <Text fontSize="sm" color="gray.400">
          {username ? `${username} (${role || "User"})` : "Authenticated user"}
        </Text>
        <Text fontSize="sm" color="purple.200">
          Currency: {currencyBalance}
        </Text>
        <Text fontSize="xs" color={dailyRewardClaimedToday ? "green.300" : "yellow.300"}>
          {dailyRewardClaimedToday
            ? "Daily login reward claimed today"
            : "Daily login reward available"}
        </Text>

        <VStack
          align="stretch"
          spacing={2}
          p={3}
          borderRadius="lg"
          border="1px solid"
          borderColor="purple.400"
          bg="linear-gradient(145deg, rgba(104,62,170,0.35), rgba(255,119,197,0.2))"
          boxShadow="0 0 22px rgba(194, 120, 255, 0.25)"
        >
          <Text fontSize="xs" color="pink.100" textTransform="uppercase" letterSpacing="0.08em">
            IVE Fan Points
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            💖 {currencyBalance}
          </Text>
          <Badge
            alignSelf="flex-start"
            px={2}
            py={1}
            borderRadius="md"
            colorScheme={dailyRewardClaimedToday ? "green" : "pink"}
          >
            {dailyRewardClaimedToday ? "Daily +1 Claimed" : "Daily +1 Ready"}
          </Badge>
          <Text fontSize="xs" color="pink.50">
            Log in once each day to claim +1 fan point.
          </Text>
        </VStack>

        <Stack mt={4} spacing={2}>
          {navItems.map((item) => (
            <Button
              key={item.to}
              as={NavLink}
              to={item.to}
              justifyContent="flex-start"
              variant="ghost"
              color="gray.200"
              _activeLink={{ bg: "purple.600", color: "white" }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Button mt="auto" colorScheme="red" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Box flex="1">
        <Outlet />
      </Box>

      <Modal isOpen={activeEventReward !== null} onClose={() => setActiveEventReward(null)} isCentered>
        <ModalOverlay />
        <ModalContent bg="#1A1630" color="white">
          <ModalHeader>{activeEventReward?.title ?? "Event Reward"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={3} color="whiteAlpha.900">{activeEventReward?.message}</Text>
            <Text color="purple.200">Claim reward: +{activeEventReward?.points ?? 0} points</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setActiveEventReward(null)}>
              Later
            </Button>
            <Button colorScheme="purple" isLoading={claimingEventReward} onClick={() => void claimEventReward()}>
              Claim
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
