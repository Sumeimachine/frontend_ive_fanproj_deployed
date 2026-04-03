import { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigate("/dashboard");
    } catch {
      setError("Login failed. Verify your credentials and email verification state.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      maxW="430px"
      w="100%"
      p={{ base: 6, md: 8 }}
      borderRadius="2xl"
      bg="rgba(255,255,255,0.06)"
      backdropFilter="blur(8px)"
      boxShadow="0 10px 35px rgba(0,0,0,0.4)"
    >
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="white">
          Welcome back 👋
        </Heading>
        <Text color="gray.300" fontSize="sm">
          Sign in with your backend auth endpoint at <b>/api/Auth/login</b>.
        </Text>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color="gray.200">Username</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="gray.200">Password</FormLabel>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </FormControl>

            <Button type="submit" colorScheme="purple" isLoading={isSubmitting}>
              Sign In
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default LoginForm;
