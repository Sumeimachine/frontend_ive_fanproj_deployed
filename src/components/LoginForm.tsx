import { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api/authApi";

type AuthMode = "login" | "register" | "forgot" | "verify";

const LoginForm = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearMessages();
  };

  const handleLogin = async () => {
    await login({ username, password });
    navigate("/dashboard");
  };

  const handleRegister = async () => {
    const response = await authApi.register({ username, email, password });
    setSuccess(response || "Registered. Please verify your email.");
  };

  const handleForgotPassword = async () => {
    const response = await authApi.forgotPassword(email);
    setSuccess(response || "Password reset email sent.");
  };


  const handleVerifyEmail = async () => {
    const response = await authApi.resendVerification(email);
    setSuccess(response || "Verification email sent.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await handleLogin();
      } else if (mode === "register") {
        await handleRegister();
      } else if (mode === "forgot") {
        await handleForgotPassword();
      } else if (mode === "verify") {
        await handleVerifyEmail();
      }
    } catch {
      setError("Request failed. Please check your input and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      maxW="500px"
      w="100%"
      p={{ base: 6, md: 8 }}
      borderRadius="2xl"
      bg="rgba(255,255,255,0.06)"
      backdropFilter="blur(8px)"
      boxShadow="0 10px 35px rgba(0,0,0,0.4)"
    >
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="white">
          Account Access
        </Heading>

        <HStack spacing={2} overflowX="auto">
          <Button size="sm" onClick={() => switchMode("login")} variant={mode === "login" ? "solid" : "outline"} colorScheme="purple">
            Login
          </Button>
          <Button size="sm" onClick={() => switchMode("register")} variant={mode === "register" ? "solid" : "outline"} colorScheme="purple">
            Register
          </Button>
          <Button size="sm" onClick={() => switchMode("forgot")} variant={mode === "forgot" ? "solid" : "outline"} colorScheme="purple">
            Forgot
          </Button>
          <Button size="sm" onClick={() => switchMode("verify")} variant={mode === "verify" ? "solid" : "outline"} colorScheme="purple">
            Resend Verify
          </Button>
        </HStack>

        <Text color="gray.300" fontSize="sm">
          Connected to backend auth endpoints under <b>/api/Auth/*</b>.
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
            {(mode === "login" || mode === "register") && (
              <FormControl isRequired>
                <FormLabel color="gray.200">Username</FormLabel>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </FormControl>
            )}

            {(mode === "register" || mode === "forgot" || mode === "verify") && (
              <FormControl isRequired>
                <FormLabel color="gray.200">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </FormControl>
            )}

            {(mode === "login" || mode === "register") && (
              <FormControl isRequired>
                <FormLabel color="gray.200">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </FormControl>
            )}

            <Button type="submit" colorScheme="purple" isLoading={isSubmitting}>
              {mode === "login" && "Sign In"}
              {mode === "register" && "Create Account"}
              {mode === "forgot" && "Send Reset Email"}
              {mode === "verify" && "Resend Verification"}
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default LoginForm;
