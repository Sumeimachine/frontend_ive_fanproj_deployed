import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Badge, Box, Button, Stack, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, username, role, currencyBalance, dailyRewardClaimedToday } = useAuth();

  const navItems = [
    { label: "Members", to: "/" },
    { label: "Dashboard", to: "/dashboard" },
    ...(role === "Admin"
      ? [
          { label: "Pages", to: "/pages" },
          { label: "Content Editor", to: "/pages/editor" },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Box display="flex" minH="100vh" bg="#080612">
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
    </Box>
  );
}
