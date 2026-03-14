import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  Image,
  Text,
} from "@chakra-ui/react";
import membersDataRaw from "../assets/members.json";

interface Member {
  id: string;
  name: string;
  photoUrl: string;
}

const membersData: Member[] = membersDataRaw as Member[];

const MemberInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const member = membersData.find((m) => m.id === id);
  const [name, setName] = useState(member?.name || "");
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl || "");

  if (!member) {
    return (
      <Box
        p={10}
        color="white"
        bgGradient="radial(circle at top, #1A152A, #0A0812 80%)"
        minH="100vh"
      >
        <Text>Member not found.</Text>
        <Button mt={4} onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </Box>
    );
  }

  const handleSave = () => {
    console.log("Updated member info:", { id, name, photoUrl });
    alert("This is a reference page. No actual data is saved.");
  };

  return (
    <Box
      p={10}
      color="white"
      bgGradient="radial(circle at top, #1A152A, #0A0812 80%)"
      minH="100vh"
    >
      <Button mb={6} onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <VStack spacing={6} align="start" maxW="500px" mx="auto">
        <Heading>{member.name}</Heading>
        <Image
          src={photoUrl}
          alt={name}
          borderRadius="20px"
          w="100%"
          objectFit="cover"
        />

        <VStack w="100%" spacing={4}>
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            bg="rgba(255,255,255,0.1)"
            color="white"
          />
          <Input
            placeholder="Photo URL"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            bg="rgba(255,255,255,0.1)"
            color="white"
          />
          <Button
            onClick={handleSave}
            bgGradient="linear(to-r, #A2D2FF, #FFAFCC)"
            color="#1A1625"
            fontWeight="600"
            borderRadius="12px"
            w="100%"
          >
            Save Changes
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default MemberInfo;
