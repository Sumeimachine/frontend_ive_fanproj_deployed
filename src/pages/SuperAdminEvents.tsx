import { useEffect, useState } from "react";
import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, Heading, HStack, Input, NumberInput, NumberInputField, Switch, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr, VStack } from "@chakra-ui/react";
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

export default function SuperAdminEvents() {
  const [events, setEvents] = useState<EventReward[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const payload = {
      ...form,
      title: form.title.trim(),
      message: form.message.trim(),
    };

    try {
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
    try {
      await eventApi.superAdminDelete(eventRewardId);
      await loadEvents();
    } catch {
      setError("Failed to delete event reward.");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color="white">Super Admin • Event Rewards</Heading>
        <Text color="whiteAlpha.800">Create reusable claim events (message + points + time window).</Text>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
          <VStack align="stretch" spacing={3}>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Title</FormLabel>
              <Input color="white" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Message</FormLabel>
              <Textarea color="white" value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
            </FormControl>
            <HStack>
              <FormControl>
                <FormLabel color="whiteAlpha.900">Points</FormLabel>
                <NumberInput min={0} value={form.points} onChange={(_, value) => setForm((prev) => ({ ...prev, points: Number.isNaN(value) ? 0 : value }))}>
                  <NumberInputField color="white" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel color="whiteAlpha.900">Start At (UTC)</FormLabel>
                <Input type="datetime-local" color="white" value={form.startAtUtc} onChange={(event) => setForm((prev) => ({ ...prev, startAtUtc: event.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="whiteAlpha.900">End At (UTC)</FormLabel>
                <Input type="datetime-local" color="white" value={form.endAtUtc} onChange={(event) => setForm((prev) => ({ ...prev, endAtUtc: event.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel color="whiteAlpha.900">Is Active</FormLabel>
                <Switch isChecked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              </FormControl>
            </HStack>
            <HStack>
              <Button colorScheme="purple" onClick={() => void submitEvent()}>{editingEventId ? "Update Event" : "Create Event"}</Button>
              {editingEventId && (
                <Button variant="outline" onClick={() => { setEditingEventId(null); setForm(defaultForm); }}>
                  Cancel Edit
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>

        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th color="whiteAlpha.900">Title</Th>
                <Th color="whiteAlpha.900">Points</Th>
                <Th color="whiteAlpha.900">Window</Th>
                <Th color="whiteAlpha.900">Claims</Th>
                <Th color="whiteAlpha.900">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {events.map((eventReward) => (
                <Tr key={eventReward.id}>
                  <Td color="white">{eventReward.title}</Td>
                  <Td color="white">{eventReward.points}</Td>
                  <Td color="whiteAlpha.900">{eventReward.startAtUtc} → {eventReward.endAtUtc}</Td>
                  <Td color="whiteAlpha.900">{eventReward.claimsCount ?? 0}</Td>
                  <Td>
                    <HStack>
                      <Button size="sm" onClick={() => startEdit(eventReward)}>Edit</Button>
                      <Button size="sm" colorScheme="red" onClick={() => void deleteEvent(eventReward.id)}>Delete</Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
}
