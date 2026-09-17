import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
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
import ResponsiveMemberImage from "../components/ResponsiveMemberImage";

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
  const [pendingPhotoDeletion, setPendingPhotoDeletion] = useState<string | null>(null);
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
      <Box p={10} color="white" bg="#0a0a0e" minH="70vh">
        <Text>Loading member profile...</Text>
      </Box>
    );
  }

  if (!member || !draft) {
    return (
      <Box p={10} color="white" bg="#0a0a0e" minH="70vh">
        <Text>Member not found.</Text>
        <Button mt={4} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  const updateDraft = <K extends keyof MemberProfile>(key: K, value: MemberProfile[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const photoPosition = `${draft.photoObjectPositionX ?? 50}% ${draft.photoObjectPositionY ?? 50}%`;

  const handleSave = async () => {
    try {
      const savedProfile = await saveMemberProfile(draft);
      setDraft(savedProfile);
      if (pendingPhotoDeletion) {
        try {
          await mediaApi.deleteMediaByUrl(pendingPhotoDeletion);
          setPendingPhotoDeletion(null);
        } catch {
          toast({
            title: "Profile saved, media cleanup failed",
            description: "The old upload is no longer referenced but could not be deleted.",
            status: "warning",
            duration: 3200,
            isClosable: true,
          });
        }
      }
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
        description: "Could not upload member media. Images must be 1 GB or smaller and match their file type.",
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
      setPendingPhotoDeletion(draft.photoUrl);
      updateDraft("photoUrl", "");
      toast({
        title: "Photo marked for deletion",
        description: "The upload will be deleted after Save Profile succeeds.",
        status: "info",
        duration: 2200,
        isClosable: true,
      });
    } catch {
      // State-only operation; retained for defensive handling.
    }
  };

  return (
    <Box minH="80vh" bg="#0a0a0e" color="#f6f3f5" py={{ base: 8, md: 12 }}>
      <Container maxW="1200px">
        <Button mb={8} variant="ghost" colorScheme="whiteAlpha" onClick={() => navigate("/#members")}>
          Back to members
        </Button>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "minmax(0, 0.85fr) minmax(0, 1.15fr)" }}
          borderRadius="3px"
          overflow="hidden"
          border="1px solid"
          borderColor="whiteAlpha.200"
          bg="#111015"
        >
          <Box position="relative" alignSelf="start">
            <ResponsiveMemberImage
              src={draft.photoUrl || draft.backupPhotoUrl || "/images/members/yujin.jpg"}
              alt={draft.name}
              sizes="(max-width: 768px) 95vw, 480px"
              pictureStyle={{ display: "block" }}
              style={{ display: "block", width: "100%", aspectRatio: "480 / 679", objectFit: "cover", objectPosition: photoPosition }}
            />
          </Box>

          <Box p={{ base: 6, md: 10 }} alignSelf="center" minW={0}>
            <VStack align="start" spacing={4} mb={10}>
              <Heading as="h1" fontSize={{ base: "5xl", md: "7xl" }} fontWeight={500} textTransform="uppercase" letterSpacing="-0.025em">{draft.name}</Heading>
              <Text color="#ef9cc2" fontSize="sm">{draft.tagline}</Text>
            </VStack>
            {isEditMode ? (
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Admin Edit Mode</Heading>
                <Text color="whiteAlpha.700" fontSize="sm">
                  Changes save to the backend for deployed visitors. Local fallback is only used if the API is unavailable.
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
                <HStack flexWrap="wrap">
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
                  <FormLabel>Image horizontal position: {draft.photoObjectPositionX ?? 50}%</FormLabel>
                  <Slider
                    min={0}
                    max={100}
                    value={draft.photoObjectPositionX ?? 50}
                    onChange={(value) => updateDraft("photoObjectPositionX", value)}
                  >
                    <SliderTrack bg="whiteAlpha.300">
                      <SliderFilledTrack bg="pink.300" />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>
                <FormControl>
                  <FormLabel>Image vertical position: {draft.photoObjectPositionY ?? 50}%</FormLabel>
                  <Slider
                    min={0}
                    max={100}
                    value={draft.photoObjectPositionY ?? 50}
                    onChange={(value) => updateDraft("photoObjectPositionY", value)}
                  >
                    <SliderTrack bg="whiteAlpha.300">
                      <SliderFilledTrack bg="purple.300" />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>
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
