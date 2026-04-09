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

type LoginFormProps = {
  showSoundToggle?: boolean;
  soundEnabled?: boolean;
  onToggleMute?: () => void;
};

const LoginForm = ({ showSoundToggle = false, soundEnabled = false, onToggleMute }: LoginFormProps) => {
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

  const inputStyles = {
    bg: "rgba(9, 10, 22, 0.9)",
    color: "#FFFFFF",
    caretColor: "#FFFFFF",
    borderColor: "whiteAlpha.300",
    _placeholder: { color: "whiteAlpha.600" },
    _hover: { borderColor: "purple.300" },
    _focusVisible: {
      borderColor: "purple.300",
      boxShadow: "0 0 0 1px rgba(182, 124, 255, 0.8)",
      bg: "rgba(13, 14, 28, 0.95)",
    },
    sx: {
      "&, &::placeholder": {
        WebkitTextFillColor: "#ffffff",
      },
      "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
        WebkitTextFillColor: "#ffffff",
        boxShadow: "0 0 0px 1000px #131629 inset",
        transition: "background-color 9999s ease-in-out 0s",
      },
    },
  };

  return (
    <Box
      className="login-panel"
      maxW="500px"
      w="100%"
      p={{ base: 6, md: 8 }}
      borderRadius="2xl"
      border="1px solid"
      borderColor="whiteAlpha.280"
      bg="linear-gradient(160deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03))"
      backdropFilter="blur(12px)"
      boxShadow="0 20px 45px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.18)"
    >
      <VStack spacing={6} align="stretch">
        <VStack align="stretch" spacing={1}>
          <Heading size="lg" color="white">
            Account Access
          </Heading>
          <Text color="whiteAlpha.800" fontSize="sm">
            Welcome back to IVE Neon Dimension.
          </Text>
        </VStack>

        <HStack className="login-mode-row" spacing={2} overflowX="auto" pb={1}>
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

        <Text color="whiteAlpha.800" fontSize="sm">
          Join in on the fun! <b>fan project By PH peeps</b>.
        </Text>
        {showSoundToggle && (
          <Button
            size="sm"
            alignSelf="flex-start"
            colorScheme="purple"
            variant="outline"
            bg="rgba(6, 7, 18, 0.45)"
            backdropFilter="blur(6px)"
            onClick={onToggleMute}
          >
            {soundEnabled ? "Sound: On" : "Sound: Off"}
          </Button>
        )}

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
                <FormLabel color="whiteAlpha.900">Username</FormLabel>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" {...inputStyles} />
              </FormControl>
            )}

            {(mode === "register" || mode === "forgot" || mode === "verify") && (
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.900">Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" {...inputStyles} />
              </FormControl>
            )}

            {(mode === "login" || mode === "register") && (
              <FormControl isRequired>
                <FormLabel color="whiteAlpha.900">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  {...inputStyles}
                />
              </FormControl>
            )}

            <Button
              type="submit"
              colorScheme="purple"
              isLoading={isSubmitting}
              bgGradient="linear(to-r, purple.500, pink.500)"
              _hover={{ bgGradient: "linear(to-r, purple.400, pink.400)" }}
            >
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
