import { Box, Container } from "@chakra-ui/react";
import LoginForm from "../components/LoginForm";

export default function Login() {
  return (
    <Box
      minH="100vh"
      bgGradient="radial(circle at top, #221b3a, #0a0812 75%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Container maxW="lg">
        <LoginForm />
      </Container>
    </Box>
  );
}
