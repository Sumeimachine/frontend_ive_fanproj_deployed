import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Input, Button, Heading, Textarea } from "@chakra-ui/react";
import membersDataRaw from "../assets/members.json";

interface Member {
  id: string;
  name: string;
  photoUrl: string;
}

const membersData: Member[] = membersDataRaw as Member[];

const MemberEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const member = membersData.find((m) => m.id === id);
  const [name, setName] = useState(member?.name || "");
  const [photoUrl, setPhotoUrl] = useState(member?.photoUrl || "");

  if (!member) return <Text>Member not found.</Text>;

  const handleSave = () => {
    console.log("Updated member info:", { id, name, photoUrl });
    alert("This is a reference page. No actual data is saved.");
  };

  return (
    <Box p={10} bgGradient="radial(circle at top, #1A152A, #0A0812 80%)" color="white" minH="100vh">
      <Button mb={6} onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <Heading mb={6}>Edit {member.name}</Heading>
      <Input mb={4} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input mb={4} placeholder="Photo URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
      <Button colorScheme="teal" onClick={handleSave}>
        Save Changes
      </Button>
    </Box>
  );
};

export default MemberEdit;