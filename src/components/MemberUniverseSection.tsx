import { Suspense, useMemo, useRef, useState } from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { Color, Vector3 } from "three";
import type { MemberProfile } from "../types/member";

interface MemberUniverseSectionProps {
  members: MemberProfile[];
  onSelectMember: (memberId: string) => void;
}

interface MemberCard3DProps {
  member: MemberProfile;
  baseAngle: number;
  radius: number;
  height: number;
  onSelectMember: (memberId: string) => void;
}

function MemberCard3D({ member, baseAngle, radius, height, onSelectMember }: MemberCard3DProps) {
  const groupRef = useRef<Group>(null);
  const cardRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const texture = useTexture(member.photoUrl);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!groupRef.current || !cardRef.current || !haloRef.current) return;

    const t = clock.getElapsedTime();
    const spinProgress = t * 0.32;
    const angle = baseAngle + spinProgress;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + baseAngle * 3);

    groupRef.current.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    groupRef.current.lookAt(camera.position.x, height, camera.position.z);

    const targetScale = hovered ? 1.06 : 0.92;
    cardRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.08);

    const haloScale = hovered ? 1.08 + pulse * 0.04 : 1 + pulse * 0.03;
    haloRef.current.scale.lerp(new Vector3(haloScale, haloScale, 1), 0.08);
  });

  const glowColor = new Color(member.accent || "#a855f7");

  return (
    <group ref={groupRef}>
      <mesh ref={haloRef} position={[0, 0, -0.02]}>
        <planeGeometry args={[1.88, 2.46]} />
        <meshBasicMaterial color={glowColor} transparent opacity={hovered ? 0.2 : 0.13} />
      </mesh>

      <mesh
        ref={cardRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelectMember(member.id)}
      >
        <planeGeometry args={[1.75, 2.38]} />
        <meshStandardMaterial map={texture} color="#ffffff" emissive="#000000" metalness={0.08} roughness={0.34} />
      </mesh>

      <mesh position={[-0.91, 0, 0.02]}>
        <boxGeometry args={[0.04, 2.38, 0.045]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={hovered ? 2.35 : 1.65}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh position={[0.91, 0, 0.02]}>
        <boxGeometry args={[0.04, 2.38, 0.045]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={hovered ? 2.35 : 1.65}
          transparent
          opacity={0.95}
        />
      </mesh>

    </group>
  );
}

function UniverseScene({ members, onSelectMember }: MemberUniverseSectionProps) {
  const slots = useMemo(() => {
    const radius = 4.6;
    return members.map((_, index) => {
      const baseAngle = (index / Math.max(members.length, 1)) * Math.PI * 2;
      const height = Math.sin(index * 0.9) * 0.35;
      return { baseAngle, height, radius };
    });
  }, [members]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const targetZ = 8.8 + Math.sin(t * 0.55) * 0.2;
    const targetY = Math.sin(t * 0.4) * 0.08;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.04;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.56} />
      <pointLight position={[3, 5, 6]} intensity={9} color="#f2c4ff" />
      <pointLight position={[-5, 1, 3]} intensity={5} color="#89cbff" />
      <pointLight position={[0, -4, 6]} intensity={2.5} color="#9e7cff" />
      <Stars radius={120} depth={86} count={3200} factor={4.8} saturation={0.5} fade speed={0.45} />

      {members.map((member, index) => (
        <MemberCard3D
          key={member.id}
          member={member}
          baseAngle={slots[index].baseAngle}
          radius={slots[index].radius}
          height={slots[index].height}
          onSelectMember={onSelectMember}
        />
      ))}
    </>
  );
}

export default function MemberUniverseSection({ members, onSelectMember }: MemberUniverseSectionProps) {
  return (
    <Box
      mt={{ base: 14, md: 20 }}
      borderRadius="2xl"
      overflow="hidden"
      border="1px solid"
      borderColor="whiteAlpha.300"
      bgGradient="linear(to-b, rgba(11,6,24,0.95), rgba(4,3,13,0.97))"
      boxShadow="0 30px 80px rgba(137, 89, 255, 0.35)"
    >
      <VStack spacing={3} textAlign="center" pt={{ base: 8, md: 10 }} px={6}>
        <Text className="eyebrow">DIVE INTO IVE!</Text>
        <Heading fontSize={{ base: "2xl", md: "4xl" }}>IVE Universe — Neon Card Orbit</Heading>
        <Text maxW="740px" color="whiteAlpha.800">
          Hover a card to highlight, then click to open
          profile.
        </Text>
      </VStack>

      <Box h={{ base: "70vh", md: "86vh" }}>
        <Canvas camera={{ position: [0, 0, 8.8], fov: 48 }}>
          <color attach="background" args={["#050216"]} />
          <fog attach="fog" args={["#06021a", 7, 45]} />
          <Suspense fallback={null}>
            <UniverseScene members={members} onSelectMember={onSelectMember} />
          </Suspense>
        </Canvas>
      </Box>
    </Box>
  );
}
