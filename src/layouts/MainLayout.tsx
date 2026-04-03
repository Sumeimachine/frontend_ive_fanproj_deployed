import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Members", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Pages", to: "/pages" },
  { label: "Content Editor", to: "/pages/editor" },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, username, role } = useAuth();

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
          IVE Admin UI
        </Text>

        <Text fontSize="sm" color="gray.400">
          {username ? `${username} (${role || "User"})` : "Authenticated user"}
        </Text>

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
