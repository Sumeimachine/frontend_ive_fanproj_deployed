import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { authApi } from "../services/api/authApi";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing token in URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.resetPassword(token, newPassword);
      setSuccess(response || "Password successfully reset.");
      setNewPassword("");
    } catch {
      setError("Failed to reset password. Token may be expired or invalid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="radial(circle at top, #221b3a, #0a0812 75%)"
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <Box
        maxW="500px"
        w="100%"
        p={{ base: 6, md: 8 }}
        borderRadius="2xl"
        bg="rgba(255,255,255,0.06)"
        backdropFilter="blur(8px)"
        boxShadow="0 10px 35px rgba(0,0,0,0.4)"
      >
        <VStack spacing={5} align="stretch">
          <Heading size="lg">Reset Password</Heading>
          <Text color="gray.300" fontSize="sm">
            Set your new password using token from reset link.
          </Text>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {success && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel color="gray.200">New Password</FormLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </FormControl>

              <Button type="submit" colorScheme="purple" isLoading={isSubmitting}>
                Update Password
              </Button>

              <Button as="a" href="/login" variant="outline">
                Back to Login
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  );
}
