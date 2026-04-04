import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Button, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { authApi } from "../services/api/authApi";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your account...");

  const hasPayload = useMemo(() => Boolean(token || email), [token, email]);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) {
      return;
    }

    hasTriggered.current = true;

    const verify = async () => {
      if (!hasPayload) {
        setStatus("error");
        setMessage(
          "Missing verification payload. Please use the email verification link again.",
        );
        return;
      }

      try {
        const response = await authApi.verifyEmail({
          token: token || undefined,
          email: email || undefined,
        });
        setStatus("success");
        setMessage(response || "Email verified successfully.");
      } catch {
        setStatus("error");
        setMessage("Verification failed. The link may be expired or invalid.");
      }
    };

    void verify();
  }, [email, hasPayload, token]);

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
      <VStack spacing={5} bg="whiteAlpha.100" p={8} borderRadius="xl" maxW="600px">
        <Heading size="lg">Email Verification</Heading>

        {status === "loading" && <Spinner color="purple.300" />}

        <Text textAlign="center">{message}</Text>

        <Button as="a" href="/login" colorScheme="purple">
          Back to Login
        </Button>
      </VStack>
    </Box>
  );
}
