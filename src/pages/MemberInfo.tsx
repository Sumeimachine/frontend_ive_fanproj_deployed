import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { mediaApi } from "../services/api/mediaApi";
import MediaPickerModal from "../components/MediaPickerModal";
import {
  getMemberProfileById,
  saveMemberProfile,
  saveMemberProfileLocally,
} from "../services/memberProfileStore";
import type { MemberProfile } from "../types/member";

const MemberInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuth();

  const canEdit = role === "Admin" || role === "Super-Admin";
  const isEditMode = canEdit && searchParams.get("edit") === "1";

  const [draft, setDraft] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    void (async () => {
      const profile = await getMemberProfileById(id);
      setDraft(profile);
      setIsLoading(false);
    })();
  }, [id]);

  const member = draft;

  if (isLoading) {
    return (
      <Box p={10} color="white" bgGradient="radial(circle at top, #1A152A, #0A0812 80%)" minH="100vh">
        <Text>Loading member profile...</Text>
      </Box>
    );
  }

  if (!member || !draft) {
    return (
      <Box p={10} color="white" bgGradient="radial(circle at top, #1A152A, #0A0812 80%)" minH="100vh">
        <Text>Member not found.</Text>
        <Button mt={4} onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </Box>
    );
  }

  const updateDraft = <K extends keyof MemberProfile>(key: K, value: MemberProfile[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    try {
      const savedProfile = await saveMemberProfile(draft);
      setDraft(savedProfile);
      toast({
        title: "Member profile updated",
        description: `${draft.name}'s profile content is now saved in backend for production use.`,
        status: "success",
        duration: 2600,
        isClosable: true,
      });
      navigate(`/member/${draft.id}`);
    } catch {
      saveMemberProfileLocally(draft);
      toast({
        title: "Backend save failed",
        description: "Saved locally only. Check API server and admin token for production persistence.",
        status: "warning",
        duration: 3200,
        isClosable: true,
      });
    }
  };

  const handleUploadPhoto = async (file: File) => {
    try {
      setIsUploadingPhoto(true);
      const upload = await mediaApi.uploadMedia(file, "members");
      updateDraft("photoUrl", upload.url);
      toast({
        title: "Photo uploaded",
        description: "Remember to click Save Profile to persist this image.",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload member image.",
        status: "error",
        duration: 2800,
        isClosable: true,
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteUploadedPhoto = async () => {
    if (!draft.photoUrl.includes("/uploads/")) {
      toast({
        title: "Cannot delete this photo",
        description: "Only backend uploaded images can be deleted from this page.",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      await mediaApi.deleteMediaByUrl(draft.photoUrl);
      updateDraft("photoUrl", "");
      toast({
        title: "Photo deleted",
        description: "Click Save Profile to keep this change.",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete member image.",
        status: "error",
        duration: 2800,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-b, #0a0717, #120b24 45%, #090512)" color="white" py={{ base: 8, md: 12 }}>
      <Container maxW="980px">
        <Button mb={6} variant="ghost" colorScheme="whiteAlpha" onClick={() => navigate("/")}>
          ← Back to members
        </Button>

        <Box
          borderRadius="2xl"
          overflow="hidden"
          border="1px solid"
          borderColor="whiteAlpha.300"
          bg="rgba(17, 11, 31, 0.8)"
          boxShadow="0 24px 80px rgba(140, 93, 255, 0.22)"
        >
          <Box position="relative" minH={{ base: "300px", md: "380px" }}>
            <Image src={draft.photoUrl} alt={draft.name} w="100%" h="100%" objectFit="cover" />
            <Box position="absolute" inset={0} bg="linear-gradient(180deg, rgba(10,7,23,0.1) 40%, rgba(10,7,23,0.92) 92%)" />
            <VStack position="absolute" left={{ base: 6, md: 10 }} bottom={{ base: 6, md: 10 }} align="start" spacing={2}>
              <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                IVE MEMBER PROFILE
              </Badge>
              <Heading size="2xl">{draft.name}</Heading>
              <Text color="purple.100">{draft.tagline}</Text>
            </VStack>
          </Box>

          <Box p={{ base: 6, md: 8 }}>
            {isEditMode ? (
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Admin Edit Mode</Heading>
                <Text color="whiteAlpha.700" fontSize="sm">
                  Changes are currently stored in browser local storage. Wire this save action to backend later.
                </Text>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Tagline</FormLabel>
                  <Input value={draft.tagline} onChange={(event) => updateDraft("tagline", event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Photo URL</FormLabel>
                  <Input value={draft.photoUrl} onChange={(event) => updateDraft("photoUrl", event.target.value)} />
                </FormControl>
                <HStack>
                  <Input
                    type="file"
                    accept="image/*"
                    display="none"
                    ref={fileInputRef}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleUploadPhoto(file);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploadingPhoto}
                    colorScheme="purple"
                    variant="outline"
                  >
                    Upload Photo
                  </Button>
                  <MediaPickerModal
                    buttonLabel="Choose Existing"
                    folder="members"
                    onSelect={(url) => updateDraft("photoUrl", url)}
                  />
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() => void handleDeleteUploadedPhoto()}
                  >
                    Delete Uploaded Photo
                  </Button>
                </HStack>
                <FormControl>
                  <FormLabel>Bio</FormLabel>
                  <Textarea
                    minH="140px"
                    value={draft.bio}
                    onChange={(event) => updateDraft("bio", event.target.value)}
                  />
                </FormControl>
                <HStack>
                  <Button colorScheme="pink" onClick={handleSave}>
                    Save Profile
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/member/${draft.id}`)}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack align="stretch" spacing={5}>
                <Heading size="md">About {draft.name}</Heading>
                <Text color="whiteAlpha.900" fontSize="md" lineHeight="1.8">
                  {draft.bio}
                </Text>

                {/* <Box
                  p={5}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  bg="rgba(255,255,255,0.04)"
                >
                  <Text fontSize="sm" color="purple.100" mb={2}>
                    Design note
                  </Text>
                  <Text color="whiteAlpha.800">
                    This page is designed as a polished profile hub for fans, while admin-only editing stays separated.
                  </Text>
                </Box> */}

                {canEdit && (
                  <Button
                    alignSelf="flex-start"
                    colorScheme="purple"
                    onClick={() => navigate(`/member/${draft.id}?edit=1`)}
                  >
                    Edit Profile (Admin)
                  </Button>
                )}
              </VStack>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MemberInfo;
