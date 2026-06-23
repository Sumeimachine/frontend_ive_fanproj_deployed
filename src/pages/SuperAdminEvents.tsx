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
  Input,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { eventApi } from "../services/api/eventApi";
import type { EventReward } from "../types/api";

const defaultForm = {
  title: "",
  message: "",
  points: 1,
  isActive: true,
  startAtUtc: "",
  endAtUtc: "",
};

const fieldStyles = {
  bg: "#151126",
  color: "white",
  borderColor: "whiteAlpha.400",
  _placeholder: { color: "whiteAlpha.500" },
};

function isLive(eventReward: EventReward) {
  const now = Date.now();
  return eventReward.isActive && new Date(eventReward.startAtUtc).getTime() <= now && new Date(eventReward.endAtUtc).getTime() >= now;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
}

export default function SuperAdminEvents() {
  const [events, setEvents] = useState<EventReward[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const liveCount = useMemo(() => events.filter(isLive).length, [events]);
  const totalClaims = useMemo(() => events.reduce((sum, eventReward) => sum + (eventReward.claimsCount ?? 0), 0), [events]);
  const totalPoints = useMemo(() => events.reduce((sum, eventReward) => sum + Math.max(0, eventReward.points), 0), [events]);

  const loadEvents = async () => {
    try {
      const data = await eventApi.superAdminList();
      setEvents(data);
      setError(null);
    } catch {
      setError("Unable to load event rewards.");
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const submitEvent = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
      };

      if (editingEventId) {
        await eventApi.superAdminUpdate(editingEventId, payload);
      } else {
        await eventApi.superAdminCreate(payload);
      }

      setForm(defaultForm);
      setEditingEventId(null);
      await loadEvents();
    } catch {
      setError("Failed to save event reward.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (eventReward: EventReward) => {
    setEditingEventId(eventReward.id);
    setForm({
      title: eventReward.title,
      message: eventReward.message,
      points: eventReward.points,
      isActive: eventReward.isActive ?? true,
      startAtUtc: eventReward.startAtUtc?.slice(0, 16) ?? "",
      endAtUtc: eventReward.endAtUtc?.slice(0, 16) ?? "",
    });
  };

  const deleteEvent = async (eventRewardId: number) => {
    if (!window.confirm("Delete this point reward event?")) {
      return;
    }

    try {
      await eventApi.superAdminDelete(eventRewardId);
      await loadEvents();
    } catch {
      setError("Failed to delete event reward.");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} minH="100vh" color="white" bg="linear-gradient(135deg, #080612, #151126 55%, #26143b)">
      <VStack align="stretch" spacing={6}>
        <Box>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            Super Admin
          </Text>
          <Heading size="lg" mt={2}>Point Reward Events</Heading>
          <Text color="whiteAlpha.800" mt={2}>
            Claimable campaigns for giving fan points during launches, milestones, and community moments.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <MetricCard label="Reward Events" value={events.length.toString()} />
          <MetricCard label="Live Now" value={liveCount.toString()} />
          <MetricCard label="Claims / Point Pool" value={`${totalClaims} / ${totalPoints}`} />
        </SimpleGrid>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Grid templateColumns={{ base: "1fr", xl: "430px 1fr" }} gap={5} alignItems="start">
          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={5}>
            <Heading size="md" mb={4}>{editingEventId ? "Edit Reward" : "Create Reward"}</Heading>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} {...fieldStyles} />
              </FormControl>
              <FormControl>
                <FormLabel>Message</FormLabel>
                <Textarea value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} minH="120px" {...fieldStyles} />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>Points</FormLabel>
                  <NumberInput min={0} value={form.points} onChange={(_, value) => setForm((prev) => ({ ...prev, points: Number.isNaN(value) ? 0 : value }))}>
                    <NumberInputField {...fieldStyles} />
                  </NumberInput>
                </FormControl>
                <FormControl display="flex" alignItems="center" gap={3} pt={{ md: 8 }}>
                  <Switch colorScheme="purple" isChecked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
                  <FormLabel mb={0}>Active</FormLabel>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Start At</FormLabel>
                <Input type="datetime-local" value={form.startAtUtc} onChange={(event) => setForm((prev) => ({ ...prev, startAtUtc: event.target.value }))} {...fieldStyles} />
              </FormControl>
              <FormControl>
                <FormLabel>End At</FormLabel>
                <Input type="datetime-local" value={form.endAtUtc} onChange={(event) => setForm((prev) => ({ ...prev, endAtUtc: event.target.value }))} {...fieldStyles} />
              </FormControl>
              <HStack>
                <Button colorScheme="purple" onClick={() => void submitEvent()} isLoading={saving}>
                  {editingEventId ? "Update Reward" : "Create Reward"}
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
            {events.map((eventReward) => (
              <Box key={eventReward.id} border="1px solid" borderColor={isLive(eventReward) ? "pink.300" : "whiteAlpha.300"} borderRadius="lg" bg="rgba(255,255,255,0.07)" p={4}>
                <HStack justify="space-between" align="start">
                  <Box>
                    <Badge colorScheme={isLive(eventReward) ? "pink" : eventReward.isActive ? "purple" : "gray"} mb={2}>
                      {isLive(eventReward) ? "Live" : eventReward.isActive ? "Scheduled" : "Inactive"}
                    </Badge>
                    <Heading size="md">{eventReward.title}</Heading>
                  </Box>
                  <Text color="purple.200" fontWeight="bold">+{eventReward.points}</Text>
                </HStack>
                <Text color="whiteAlpha.800" mt={3} whiteSpace="pre-wrap">{eventReward.message}</Text>
                <Box mt={4} color="whiteAlpha.700" fontSize="sm">
                  <Text>{formatDate(eventReward.startAtUtc)}</Text>
                  <Text>to {formatDate(eventReward.endAtUtc)}</Text>
                  <Text mt={2}>Claims: {eventReward.claimsCount ?? 0}</Text>
                </Box>
                <HStack mt={4}>
                  <Button size="sm" onClick={() => startEdit(eventReward)}>Edit</Button>
                  <Button size="sm" colorScheme="red" onClick={() => void deleteEvent(eventReward.id)}>Delete</Button>
                </HStack>
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
