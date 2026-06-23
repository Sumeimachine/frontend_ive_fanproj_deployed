import { useEffect, useId, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Image,
  Input,
  Select,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spinner,
  Switch,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import MediaPickerModal from "../components/MediaPickerModal";
import type { ContentPage, PageSection } from "../content/pageTemplates";
import { defaultPages } from "../content/pageTemplates";
import { getMemberProfiles, saveMemberProfile } from "../services/memberProfileStore";
import { contentApi } from "../services/api/contentApi";
import { mediaApi } from "../services/api/mediaApi";
import { ContentPageView } from "./DynamicContentPage";
import type { MemberProfile } from "../types/member";

type EditableLayout = PageSection["layout"];
type EditorWorkspace = "pages" | "community";

const emptyPage = (): ContentPage => ({
  slug: "new-page",
  title: "New Page",
  description: "",
  heroImageUrl: null,
  heroImagePositionX: 50,
  heroImagePositionY: 50,
  accentImageUrl: null,
  accentImagePositionX: 50,
  accentImagePositionY: 50,
  ctaLabel: "",
  ctaUrl: "",
  isPublished: false,
  sections: [
    {
      id: crypto.randomUUID(),
      title: "Opening Section",
      body: "",
      imageUrl: null,
      imagePositionX: 50,
      imagePositionY: 50,
      layout: "feature",
      sortOrder: 1,
    },
  ],
});

const fieldStyles = {
  bg: "#151126",
  color: "white",
  borderColor: "whiteAlpha.400",
  _placeholder: { color: "whiteAlpha.500" },
  _focusVisible: { borderColor: "pink.300", boxShadow: "0 0 0 1px rgba(255, 136, 197, 0.8)" },
};

const selectStyles = {
  ...fieldStyles,
  sx: {
    option: {
      bg: "#151126",
      color: "white",
    },
  },
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ContentEditor() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [workspace, setWorkspace] = useState<EditorWorkspace>(
    searchParams.get("workspace") === "community" ? "community" : "pages",
  );
  const [selectedSlug, setSelectedSlug] = useState(searchParams.get("slug") ?? "");
  const [draft, setDraft] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [memberDrafts, setMemberDrafts] = useState<MemberProfile[]>([]);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  const selectedPage = useMemo(() => pages.find((page) => page.slug === selectedSlug) ?? null, [pages, selectedSlug]);

  const loadPages = async (preferredSlug?: string) => {
    try {
      setLoading(true);
      const loadedPages = await contentApi.getAdminPages();
      setPages(loadedPages);
      const nextSlug = preferredSlug ?? selectedSlug ?? loadedPages[0]?.slug ?? "";
      setSelectedSlug(nextSlug);
      setSearchParams(nextSlug ? { slug: nextSlug } : {});
      setError(null);
    } catch {
      setPages(defaultPages);
      setSelectedSlug(defaultPages[0]?.slug ?? "");
      setError("Backend content could not be loaded. Showing defaults until the API is available.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPages(searchParams.get("slug") ?? undefined);
    void (async () => {
      setMemberDrafts(await getMemberProfiles());
    })();
  }, []);

  useEffect(() => {
    setDraft(selectedPage ? structuredClone(selectedPage) : null);
  }, [selectedPage]);

  const updateDraft = (patch: Partial<ContentPage>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateSection = (sectionId: string, patch: Partial<PageSection>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === sectionId ? { ...section, ...patch } : section,
            ),
          }
        : current,
    );
  };

  const addSection = () => {
    setDraft((current) => {
      if (!current) return current;
      const nextSort = current.sections.length + 1;
      return {
        ...current,
        sections: [
          ...current.sections,
          {
            id: crypto.randomUUID(),
            title: `Section ${nextSort}`,
            body: "",
            imageUrl: null,
            imagePositionX: 50,
            imagePositionY: 50,
            layout: "text",
            sortOrder: nextSort,
          },
        ],
      };
    });
  };

  const removeSection = (sectionId: string) => {
    if (!window.confirm("Delete this content section?")) {
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            sections: current.sections
              .filter((section) => section.id !== sectionId)
              .map((section, index) => ({ ...section, sortOrder: index + 1 })),
          }
        : current,
    );
  };

  const createNewPage = () => {
    const next = emptyPage();
    setWorkspace("pages");
    setDraft(next);
    setSelectedSlug("");
    setSearchParams({});
  };

  const saveDraft = async () => {
    if (!draft) return;
    const slug = normalizeSlug(draft.slug);
    if (!slug || !draft.title.trim()) {
      setError("Slug and title are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...draft,
        slug,
        sections: draft.sections.map((section, index) => ({ ...section, sortOrder: index + 1 })),
      };

      const exists = pages.some((page) => page.slug === slug);
      const saved = exists ? await contentApi.savePage(payload) : await contentApi.createPage(payload);
      toast({ title: "Content saved", description: `${saved.title} is stored on the backend.`, status: "success", duration: 2200, isClosable: true });
      await loadPages(saved.slug);
    } catch {
      setError("Content save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async () => {
    if (!draft || !pages.some((page) => page.slug === draft.slug)) return;
    if (!window.confirm(`Delete "${draft.title}"? This removes the page from published content.`)) {
      return;
    }

    try {
      setSaving(true);
      await contentApi.deletePage(draft.slug);
      toast({ title: "Content page deleted", status: "success", duration: 2200, isClosable: true });
      await loadPages();
    } catch {
      setError("Content delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const uploadMedia = async (file: File, key: string, onUrl: (url: string) => void) => {
    try {
      setUploadingKey(key);
      const upload = await mediaApi.uploadMedia(file, "content");
      onUrl(upload.url);
    } catch {
      setError("Media upload failed.");
    } finally {
      setUploadingKey(null);
    }
  };

  const patchMemberDraft = (memberId: string, patch: Partial<MemberProfile>) => {
    setMemberDrafts((current) =>
      current.map((member) => (member.id === memberId ? { ...member, ...patch } : member)),
    );
  };

  const saveMemberDraft = async (member: MemberProfile) => {
    try {
      setSavingMemberId(member.id);
      const saved = await saveMemberProfile(member);
      setMemberDrafts((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      toast({ title: "Member content saved", description: `${saved.name} profile updated.`, status: "success", duration: 2200, isClosable: true });
    } catch {
      setError("Member profile save failed.");
    } finally {
      setSavingMemberId(null);
    }
  };

  return (
    <Box p={{ base: 5, md: 8 }} color="white" minH="100vh" bg="linear-gradient(135deg, #080612, #151126 55%, #26143b)">
      <VStack align="stretch" spacing={6} maxW="1240px" mx="auto">
        <Box>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            Admin content studio
          </Text>
          <Heading mt={2}>Content Editor</Heading>
          <Text color="whiteAlpha.800" mt={2}>
            Control deployed pages, hero images, section media, CTA links, and publish state from one backend-backed editor.
          </Text>
        </Box>

        {error && (
          <Alert status="error" borderRadius="md" bg="rgba(130, 28, 64, 0.35)" color="white">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <VStack py={10}>
            <Spinner color="purple.300" />
          </VStack>
        ) : (
          <Grid templateColumns={{ base: "1fr", lg: "290px 1fr" }} gap={5} alignItems="start">
            <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={4}>
              <HStack justify="space-between" mb={4}>
                <Heading size="sm">Pages</Heading>
                <Button size="sm" colorScheme="pink" onClick={createNewPage}>
                  New
                </Button>
              </HStack>
              <VStack align="stretch" spacing={2}>
                <Button
                  justifyContent="space-between"
                  variant={workspace === "community" ? "solid" : "ghost"}
                  colorScheme={workspace === "community" ? "pink" : undefined}
                  color={workspace === "community" ? "white" : "whiteAlpha.900"}
                  onClick={() => {
                    setWorkspace("community");
                    setSearchParams({ workspace: "community" });
                  }}
                >
                  <Text noOfLines={1}>Community Hub</Text>
                  <Badge colorScheme="pink">Members</Badge>
                </Button>
                {pages.map((page) => (
                  <Button
                    key={page.slug}
                    justifyContent="space-between"
                    variant={workspace === "pages" && page.slug === selectedSlug ? "solid" : "ghost"}
                    colorScheme={workspace === "pages" && page.slug === selectedSlug ? "purple" : undefined}
                    color={workspace === "pages" && page.slug === selectedSlug ? "white" : "whiteAlpha.900"}
                    onClick={() => {
                      setWorkspace("pages");
                      setSelectedSlug(page.slug);
                      setSearchParams({ slug: page.slug });
                    }}
                  >
                    <Text noOfLines={1}>{page.title}</Text>
                    <Badge colorScheme={page.isPublished ? "green" : "yellow"}>{page.isPublished ? "Live" : "Draft"}</Badge>
                  </Button>
                ))}
              </VStack>
            </Box>

            {workspace === "community" ? (
              <MemberProfileContentPanel
                memberDrafts={memberDrafts}
                savingMemberId={savingMemberId}
                uploadingKey={uploadingKey}
                onPatchMember={patchMemberDraft}
                onSaveMember={(member) => void saveMemberDraft(member)}
                onUploadMedia={uploadMedia}
              />
            ) : draft && (
              <VStack align="stretch" spacing={5}>
                <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={{ base: 4, md: 5 }}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Slug</FormLabel>
                      <Input value={draft.slug} onChange={(event) => updateDraft({ slug: normalizeSlug(event.target.value) })} {...fieldStyles} />
                    </FormControl>
                    <FormControl display="flex" alignItems="center" gap={3} pt={{ md: 8 }}>
                      <Switch colorScheme="purple" isChecked={draft.isPublished} onChange={(event) => updateDraft({ isPublished: event.target.checked })} />
                      <FormLabel mb={0}>Published</FormLabel>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Title</FormLabel>
                      <Input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} {...fieldStyles} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Input value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} {...fieldStyles} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>CTA Label</FormLabel>
                      <Input value={draft.ctaLabel ?? ""} onChange={(event) => updateDraft({ ctaLabel: event.target.value })} {...fieldStyles} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>CTA URL</FormLabel>
                      <Input value={draft.ctaUrl ?? ""} onChange={(event) => updateDraft({ ctaUrl: event.target.value })} {...fieldStyles} />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={5}>
                    <MediaField
                      label="Hero Image"
                      value={draft.heroImageUrl}
                      positionX={draft.heroImagePositionX ?? 50}
                      positionY={draft.heroImagePositionY ?? 50}
                      isUploading={uploadingKey === "hero"}
                      onSelect={(url) => updateDraft({ heroImageUrl: url })}
                      onClear={() => updateDraft({ heroImageUrl: null })}
                      onUpload={(file) => void uploadMedia(file, "hero", (url) => updateDraft({ heroImageUrl: url }))}
                      onPositionChange={(x, y) => updateDraft({ heroImagePositionX: x, heroImagePositionY: y })}
                    />
                    <MediaField
                      label="Accent Image"
                      value={draft.accentImageUrl}
                      positionX={draft.accentImagePositionX ?? 50}
                      positionY={draft.accentImagePositionY ?? 50}
                      isUploading={uploadingKey === "accent"}
                      onSelect={(url) => updateDraft({ accentImageUrl: url })}
                      onClear={() => updateDraft({ accentImageUrl: null })}
                      onUpload={(file) => void uploadMedia(file, "accent", (url) => updateDraft({ accentImageUrl: url }))}
                      onPositionChange={(x, y) => updateDraft({ accentImagePositionX: x, accentImagePositionY: y })}
                    />
                  </SimpleGrid>
                </Box>

                <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={{ base: 4, md: 5 }}>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Sections</Heading>
                    <Button size="sm" colorScheme="pink" onClick={addSection}>
                      Add Section
                    </Button>
                  </HStack>

                  <VStack align="stretch" spacing={4}>
                    {draft.sections.map((section) => (
                      <Box key={section.id} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.06)" p={4}>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <FormControl>
                            <FormLabel>Title</FormLabel>
                            <Input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} {...fieldStyles} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Layout</FormLabel>
                            <Select value={section.layout} onChange={(event) => updateSection(section.id, { layout: event.target.value as EditableLayout })} {...selectStyles}>
                              <option value="text">Text</option>
                              <option value="feature">Feature</option>
                              <option value="image-left">Image Left</option>
                              <option value="image-right">Image Right</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Sort</FormLabel>
                            <Input type="number" value={section.sortOrder} onChange={(event) => updateSection(section.id, { sortOrder: Number(event.target.value) || 1 })} {...fieldStyles} />
                          </FormControl>
                        </SimpleGrid>

                        <FormControl mt={4}>
                          <FormLabel>Body</FormLabel>
                          <Textarea minH="140px" value={section.body} onChange={(event) => updateSection(section.id, { body: event.target.value })} {...fieldStyles} />
                        </FormControl>

                        <MediaField
                          label="Section Image"
                          value={section.imageUrl}
                          positionX={section.imagePositionX ?? 50}
                          positionY={section.imagePositionY ?? 50}
                          isUploading={uploadingKey === section.id}
                          onSelect={(url) => updateSection(section.id, { imageUrl: url })}
                          onClear={() => updateSection(section.id, { imageUrl: null })}
                          onUpload={(file) => void uploadMedia(file, section.id, (url) => updateSection(section.id, { imageUrl: url }))}
                          onPositionChange={(x, y) => updateSection(section.id, { imagePositionX: x, imagePositionY: y })}
                        />

                        <Button mt={4} size="sm" variant="outline" colorScheme="red" onClick={() => removeSection(section.id)} isDisabled={draft.sections.length <= 1}>
                          Delete Section
                        </Button>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <HStack>
                  <Button colorScheme="purple" onClick={() => void saveDraft()} isLoading={saving}>
                    Save Content
                  </Button>
                  <Button variant="outline" colorScheme="red" onClick={() => void deleteDraft()} isDisabled={!pages.some((page) => page.slug === draft.slug)} isLoading={saving}>
                    Delete Page
                  </Button>
                </HStack>

                <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" overflow="hidden">
                  <Box bg="rgba(255,255,255,0.08)" px={4} py={3}>
                    <Text color="whiteAlpha.900" fontWeight="semibold">Live Preview</Text>
                  </Box>
                  <Box maxH="760px" overflowY="auto">
                    <ContentPageView page={draft} />
                  </Box>
                </Box>
              </VStack>
            )}
          </Grid>
        )}

      </VStack>
    </Box>
  );
}

function MemberProfileContentPanel({
  memberDrafts,
  savingMemberId,
  uploadingKey,
  onPatchMember,
  onSaveMember,
  onUploadMedia,
}: {
  memberDrafts: MemberProfile[];
  savingMemberId: string | null;
  uploadingKey: string | null;
  onPatchMember: (memberId: string, patch: Partial<MemberProfile>) => void;
  onSaveMember: (member: MemberProfile) => void;
  onUploadMedia: (file: File, key: string, onUrl: (url: string) => void) => void;
}) {
  return (
    <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={{ base: 4, md: 5 }}>
      <Box mb={4}>
        <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
          Community Hub
        </Text>
        <Heading size="md" mt={1}>Member Profile Content</Heading>
        <Text color="whiteAlpha.750" fontSize="sm" mt={1}>
          Edit member profile text, profile image, accent color, and crop position from one dedicated content workspace.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        {memberDrafts.map((member) => {
          const uploadId = `member-content-upload-${member.id}`;
          const objectPosition = `${member.photoObjectPositionX ?? 50}% ${member.photoObjectPositionY ?? 50}%`;

          return (
            <Box key={member.id} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.06)" p={4}>
              <Grid templateColumns={{ base: "1fr", md: "190px 1fr" }} gap={4}>
                <Box>
                  <Image src={member.photoUrl} alt={member.name} w="100%" h="230px" objectFit="cover" objectPosition={objectPosition} borderRadius="md" />
                  <Text color="whiteAlpha.700" fontSize="xs" mt={2}>
                    Preview crop: {member.photoObjectPositionX ?? 50}% / {member.photoObjectPositionY ?? 50}%
                  </Text>
                </Box>

                <VStack align="stretch" spacing={3}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <FormControl>
                      <FormLabel>Name</FormLabel>
                      <Input value={member.name} onChange={(event) => onPatchMember(member.id, { name: event.target.value })} {...fieldStyles} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Accent</FormLabel>
                      <Input type="color" value={member.accent} onChange={(event) => onPatchMember(member.id, { accent: event.target.value })} h="40px" p={1} bg="#151126" borderColor="whiteAlpha.400" />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Tagline</FormLabel>
                    <Input value={member.tagline} onChange={(event) => onPatchMember(member.id, { tagline: event.target.value })} {...fieldStyles} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Photo URL</FormLabel>
                    <Input value={member.photoUrl} onChange={(event) => onPatchMember(member.id, { photoUrl: event.target.value })} {...fieldStyles} />
                  </FormControl>

                  <HStack flexWrap="wrap">
                    <Input
                      id={uploadId}
                      type="file"
                      accept="image/*"
                      display="none"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          onUploadMedia(file, `member-${member.id}`, (url) => onPatchMember(member.id, { photoUrl: url }));
                        }
                        event.target.value = "";
                      }}
                    />
                    <Button as="label" htmlFor={uploadId} size="sm" colorScheme="purple" isLoading={uploadingKey === `member-${member.id}`}>
                      Upload
                    </Button>
                    <MediaPickerModal buttonLabel="Choose Existing" folder="members" onSelect={(url) => onPatchMember(member.id, { photoUrl: url })} />
                  </HStack>

                  <FormControl>
                    <FormLabel>Horizontal crop: {member.photoObjectPositionX ?? 50}%</FormLabel>
                    <Slider min={0} max={100} value={member.photoObjectPositionX ?? 50} onChange={(value) => onPatchMember(member.id, { photoObjectPositionX: value })}>
                      <SliderTrack bg="whiteAlpha.300"><SliderFilledTrack bg="pink.300" /></SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Vertical crop: {member.photoObjectPositionY ?? 50}%</FormLabel>
                    <Slider min={0} max={100} value={member.photoObjectPositionY ?? 50} onChange={(value) => onPatchMember(member.id, { photoObjectPositionY: value })}>
                      <SliderTrack bg="whiteAlpha.300"><SliderFilledTrack bg="purple.300" /></SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Bio</FormLabel>
                    <Textarea minH="120px" value={member.bio} onChange={(event) => onPatchMember(member.id, { bio: event.target.value })} {...fieldStyles} />
                  </FormControl>

                  <Button alignSelf="flex-start" colorScheme="pink" onClick={() => onSaveMember(member)} isLoading={savingMemberId === member.id}>
                    Save Member
                  </Button>
                </VStack>
              </Grid>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function MediaField({
  label,
  value,
  positionX = 50,
  positionY = 50,
  isUploading,
  onSelect,
  onClear,
  onUpload,
  onPositionChange,
}: {
  label: string;
  value?: string | null;
  positionX?: number;
  positionY?: number;
  isUploading: boolean;
  onSelect: (url: string) => void;
  onClear: () => void;
  onUpload: (file: File) => void;
  onPositionChange?: (x: number, y: number) => void;
}) {
  const inputId = useId();
  const objectPosition = `${positionX}% ${positionY}%`;

  return (
    <Box mt={4}>
      <Text fontWeight="semibold" mb={2}>{label}</Text>
      {value && (
        <Box mb={3}>
          <Image src={value} alt={label} w="100%" h="180px" borderRadius="md" objectFit="cover" objectPosition={objectPosition} />
          <Text color="whiteAlpha.700" fontSize="xs" mt={2}>
            Preview crop: {positionX}% / {positionY}%
          </Text>
          {onPositionChange && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={3}>
              <FormControl>
                <FormLabel fontSize="xs">Horizontal crop</FormLabel>
                <Slider min={0} max={100} value={positionX} onChange={(value) => onPositionChange(value, positionY)}>
                  <SliderTrack bg="whiteAlpha.300"><SliderFilledTrack bg="pink.300" /></SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Vertical crop</FormLabel>
                <Slider min={0} max={100} value={positionY} onChange={(value) => onPositionChange(positionX, value)}>
                  <SliderTrack bg="whiteAlpha.300"><SliderFilledTrack bg="purple.300" /></SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
            </SimpleGrid>
          )}
        </Box>
      )}
      <HStack flexWrap="wrap">
        <Input
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          display="none"
          id={inputId}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
        <Button as="label" htmlFor={inputId} size="sm" colorScheme="purple" isLoading={isUploading}>
          Upload
        </Button>
        <MediaPickerModal buttonLabel="Choose Existing" onSelect={onSelect} />
        {value && (
          <Button size="sm" variant="outline" colorScheme="red" onClick={onClear}>
            Clear
          </Button>
        )}
      </HStack>
    </Box>
  );
}
