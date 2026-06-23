import { useEffect, useMemo, useState } from "react";
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
  Stat,
  StatLabel,
  StatNumber,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import MediaPickerModal from "../components/MediaPickerModal";
import { fanEventApi, type FanEventPayload } from "../services/api/fanEventApi";
import { mediaApi } from "../services/api/mediaApi";
import type { FanEvent } from "../types/api";

const defaultForm: FanEventPayload = {
  title: "",
  summary: "",
  description: "",
  eventType: "fanmeet",
  location: "",
  venue: "",
  bannerImageUrl: "",
  ticketUrl: "",
  status: "scheduled",
  isPublished: true,
  startAtUtc: "",
  endAtUtc: "",
};

const fieldStyles = {
  bg: "#151126",
  color: "white",
  borderColor: "whiteAlpha.400",
  _placeholder: { color: "whiteAlpha.500" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
}

function isUpcoming(eventItem: FanEvent) {
  return new Date(eventItem.endAtUtc).getTime() >= Date.now();
}

export default function SuperAdminFanEvents() {
  const [events, setEvents] = useState<FanEvent[]>([]);
  const [form, setForm] = useState<FanEventPayload>(defaultForm);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const publishedCount = useMemo(() => events.filter((eventItem) => eventItem.isPublished).length, [events]);
  const upcomingCount = useMemo(() => events.filter(isUpcoming).length, [events]);
  const openCount = useMemo(() => events.filter((eventItem) => eventItem.status === "open").length, [events]);

  const loadEvents = async () => {
    try {
      setEvents(await fanEventApi.superAdminList());
      setError(null);
    } catch {
      setError("Unable to load fan events.");
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const updateForm = (patch: Partial<FanEventPayload>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const submitEvent = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...form,
        title: form.title.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        venue: form.venue.trim(),
        eventType: form.eventType.trim().toLowerCase(),
        status: form.status.trim().toLowerCase(),
      };

      if (editingEventId) {
        await fanEventApi.superAdminUpdate(editingEventId, payload);
      } else {
        await fanEventApi.superAdminCreate(payload);
      }

      setForm(defaultForm);
      setEditingEventId(null);
      await loadEvents();
    } catch {
      setError("Failed to save fan event.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (eventItem: FanEvent) => {
    setEditingEventId(eventItem.id);
    setForm({
      title: eventItem.title,
      summary: eventItem.summary,
      description: eventItem.description,
      eventType: eventItem.eventType,
      location: eventItem.location,
      venue: eventItem.venue,
      bannerImageUrl: eventItem.bannerImageUrl ?? "",
      ticketUrl: eventItem.ticketUrl ?? "",
      status: eventItem.status,
      isPublished: eventItem.isPublished,
      startAtUtc: eventItem.startAtUtc.slice(0, 16),
      endAtUtc: eventItem.endAtUtc.slice(0, 16),
    });
  };

  const deleteEvent = async (eventId: number) => {
    if (!window.confirm("Delete this fan event?")) {
      return;
    }

    try {
      await fanEventApi.superAdminDelete(eventId);
      await loadEvents();
    } catch {
      setError("Failed to delete fan event.");
    }
  };

  const uploadBanner = async (file?: File) => {
    if (!file) return;

    try {
      setUploadingBanner(true);
      const upload = await mediaApi.uploadMedia(file, "events");
      updateForm({ bannerImageUrl: upload.url });
    } catch {
      setError("Banner upload failed.");
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} minH="100vh" color="white" bg="linear-gradient(135deg, #080612, #151126 55%, #26143b)">
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            Super Admin
          </Text>
          <Heading size="lg" mt={2}>Fan Event Manager</Heading>
          <Text color="whiteAlpha.800" mt={2}>
            Manage fanmeets, watch parties, cupsleeves, concerts, and community schedule posts separately from point rewards.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <MetricCard label="Fan Events" value={events.length.toString()} />
          <MetricCard label="Published" value={publishedCount.toString()} />
          <MetricCard label="Upcoming / Open" value={`${upcomingCount} / ${openCount}`} />
        </SimpleGrid>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Grid templateColumns={{ base: "1fr", xl: "460px 1fr" }} gap={5} alignItems="start">
          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={5}>
            <Heading size="md" mb={4}>{editingEventId ? "Edit Fan Event" : "Create Fan Event"}</Heading>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input value={form.title} onChange={(event) => updateForm({ title: event.target.value })} {...fieldStyles} />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Event Type</FormLabel>
                  <Select value={form.eventType} onChange={(event) => updateForm({ eventType: event.target.value })} {...fieldStyles}>
                    <option value="fanmeet">Fanmeet</option>
                    <option value="concert">Concert</option>
                    <option value="cupsleeve">Cupsleeve</option>
                    <option value="watch-party">Watch Party</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={form.status} onChange={(event) => updateForm({ status: event.target.value })} {...fieldStyles}>
                    <option value="scheduled">Scheduled</option>
                    <option value="open">Open</option>
                    <option value="sold-out">Sold Out</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Summary</FormLabel>
                <Input value={form.summary} onChange={(event) => updateForm({ summary: event.target.value })} {...fieldStyles} />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={form.description} onChange={(event) => updateForm({ description: event.target.value })} minH="120px" {...fieldStyles} />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input value={form.location} onChange={(event) => updateForm({ location: event.target.value })} {...fieldStyles} />
                </FormControl>
                <FormControl>
                  <FormLabel>Venue</FormLabel>
                  <Input value={form.venue} onChange={(event) => updateForm({ venue: event.target.value })} {...fieldStyles} />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Ticket / Info URL</FormLabel>
                <Input value={form.ticketUrl ?? ""} onChange={(event) => updateForm({ ticketUrl: event.target.value })} {...fieldStyles} />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Start At</FormLabel>
                  <Input type="datetime-local" value={form.startAtUtc} onChange={(event) => updateForm({ startAtUtc: event.target.value })} {...fieldStyles} />
                </FormControl>
                <FormControl>
                  <FormLabel>End At</FormLabel>
                  <Input type="datetime-local" value={form.endAtUtc} onChange={(event) => updateForm({ endAtUtc: event.target.value })} {...fieldStyles} />
                </FormControl>
              </SimpleGrid>
              <FormControl display="flex" alignItems="center" gap={3}>
                <Switch colorScheme="purple" isChecked={form.isPublished} onChange={(event) => updateForm({ isPublished: event.target.checked })} />
                <FormLabel mb={0}>Published</FormLabel>
              </FormControl>
              <Box>
                <FormLabel>Banner Image</FormLabel>
                {form.bannerImageUrl && <Image src={form.bannerImageUrl} alt="Event banner preview" h="170px" w="100%" objectFit="cover" borderRadius="md" mb={3} />}
                <HStack flexWrap="wrap">
                  <Input
                    id="fan-event-banner-upload"
                    type="file"
                    accept="image/*"
                    display="none"
                    onChange={(event) => {
                      void uploadBanner(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <Button as="label" htmlFor="fan-event-banner-upload" size="sm" colorScheme="purple" isLoading={uploadingBanner}>
                    Upload Banner
                  </Button>
                  <MediaPickerModal buttonLabel="Choose Existing" folder="events" onSelect={(url) => updateForm({ bannerImageUrl: url })} />
                  {form.bannerImageUrl && (
                    <Button size="sm" variant="outline" colorScheme="red" onClick={() => updateForm({ bannerImageUrl: "" })}>
                      Clear
                    </Button>
                  )}
                </HStack>
              </Box>
              <HStack>
                <Button colorScheme="purple" onClick={() => void submitEvent()} isLoading={saving}>
                  {editingEventId ? "Update Fan Event" : "Create Fan Event"}
                </Button>
                {editingEventId && (
                  <Button variant="outline" onClick={() => { setEditingEventId(null); setForm(defaultForm); }}>
                    Cancel
                  </Button>
                )}
              </HStack>
            </VStack>
          </Box>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            {events.map((eventItem) => (
              <Box key={eventItem.id} border="1px solid" borderColor={eventItem.status === "open" ? "pink.300" : "whiteAlpha.300"} borderRadius="lg" bg="rgba(255,255,255,0.07)" overflow="hidden">
                {eventItem.bannerImageUrl && <Image src={eventItem.bannerImageUrl} alt={eventItem.title} h="190px" w="100%" objectFit="cover" />}
                <Box p={4}>
                  <HStack justify="space-between" align="start">
                    <Box>
                      <Badge colorScheme={eventItem.isPublished ? "purple" : "yellow"} mr={2}>
                        {eventItem.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Badge colorScheme={eventItem.status === "open" ? "pink" : eventItem.status === "cancelled" ? "red" : "gray"}>
                        {eventItem.status}
                      </Badge>
                      <Heading size="md" mt={3}>{eventItem.title}</Heading>
                    </Box>
                    <Text color="pink.200" fontSize="xs" textTransform="uppercase">{eventItem.eventType}</Text>
                  </HStack>
                  <Text color="whiteAlpha.800" mt={3}>{eventItem.summary}</Text>
                  <Text color="whiteAlpha.650" fontSize="sm" mt={3}>{eventItem.venue} {eventItem.location ? `| ${eventItem.location}` : ""}</Text>
                  <Text color="whiteAlpha.750" fontSize="sm" mt={3}>{formatDate(eventItem.startAtUtc)} to {formatDate(eventItem.endAtUtc)}</Text>
                  <HStack mt={4} flexWrap="wrap">
                    <Button size="sm" onClick={() => startEdit(eventItem)}>Edit</Button>
                    {eventItem.ticketUrl && (
                      <Button size="sm" variant="outline" as="a" href={eventItem.ticketUrl} target="_blank" rel="noreferrer noopener">
                        Open Link
                      </Button>
                    )}
                    <Button size="sm" colorScheme="red" onClick={() => void deleteEvent(eventItem.id)}>Delete</Button>
                  </HStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Grid>
      </VStack>
    </Box>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Stat border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={4}>
      <StatLabel color="whiteAlpha.700">{label}</StatLabel>
      <StatNumber color="white" fontSize="2xl">{value}</StatNumber>
    </Stat>
  );
}
