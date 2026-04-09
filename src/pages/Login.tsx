import { useRef, useState } from "react";
import { Box, Container } from "@chakra-ui/react";
import LoginForm from "../components/LoginForm";

export default function Login() {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleSound = () => {
    const nextSoundEnabled = !soundEnabled;
    setSoundEnabled(nextSoundEnabled);
    setIsMuted(!nextSoundEnabled);

    if (nextSoundEnabled) {
      void videoRef.current?.play().catch(() => {
        // Ignore: this can fail if browser policy blocks playback.
      });
    }
  };

  return (
    <Box
      className="login-page"
      minH="100vh"
      position="relative"
      overflow="hidden"
      bgGradient="radial(circle at top, #2e2256 0%, #100a1f 52%, #070611 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={{ base: 8, md: 12 }}
    >
      {!videoFailed ? (
        <Box
          as="video"
          ref={videoRef}
          className="login-collage login-video"
          position="absolute"
          inset={0}
          src="/videos/login-bg.mp4"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <Box
          className="login-collage"
          position="absolute"
          inset={0}
          bgImage='url("/images/login/login-tour-bg.jpg")'
          bgPosition="center"
          bgSize="cover"
          bgRepeat="no-repeat"
        />
      )}
      <Box className="login-overlay" position="absolute" inset={0} bg="linear-gradient(180deg, rgba(12,8,26,0.48), rgba(7,6,17,0.92))" />

      <Box
        className="login-glow login-glow-left"
        position="absolute"
        top="-120px"
        left="-80px"
        w="360px"
        h="360px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(169,113,255,0.46), transparent 68%)"
        filter="blur(5px)"
        pointerEvents="none"
      />
      <Box
        className="login-glow login-glow-right"
        position="absolute"
        bottom="-140px"
        right="-70px"
        w="390px"
        h="390px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(76,214,255,0.33), transparent 70%)"
        filter="blur(7px)"
        pointerEvents="none"
      />

      <Container maxW="lg" position="relative" zIndex={1}>
        <LoginForm
          showSoundToggle={!videoFailed}
          soundEnabled={soundEnabled}
          onToggleMute={toggleSound}
        />
      </Container>
    </Box>
  );
}
