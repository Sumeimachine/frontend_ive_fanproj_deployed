import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Image,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { fanEventApi } from "../services/api/fanEventApi";
import type { FanEvent } from "../types/api";

const statusColors: Record<string, string> = {
  scheduled: "purple",
  open: "green",
  "sold-out": "orange",
  completed: "gray",
  cancelled: "red",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isUpcoming(eventItem: FanEvent) {
  return new Date(eventItem.endAtUtc).getTime() >= Date.now();
}

function eventTypeLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function FanEvents() {
  const [events, setEvents] = useState<FanEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setEvents(await fanEventApi.listPublished());
        setError(null);
      } catch {
        setError("Unable to load fan events right now.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredEvents = useMemo(() => {
    return events
      .filter((eventItem) => {
        if (statusFilter !== "all" && eventItem.status !== statusFilter) return false;
        if (timeFilter === "upcoming") return isUpcoming(eventItem);
        if (timeFilter === "past") return !isUpcoming(eventItem);
        return true;
      })
      .sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());
  }, [events, statusFilter, timeFilter]);

  const nextEvent = useMemo(() => filteredEvents.find(isUpcoming) ?? filteredEvents[0] ?? null, [filteredEvents]);
  const remainingEvents = useMemo(
    () => filteredEvents.filter((eventItem) => eventItem.id !== nextEvent?.id),
    [filteredEvents, nextEvent],
  );

  return (
    <Box minH="100vh" color="white" bg="linear-gradient(135deg, #070610, #131125 48%, #251333)" p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6} maxW="1180px" mx="auto">
        <Grid templateColumns={{ base: "1fr", lg: "1.15fr 0.85fr" }} gap={5} alignItems="stretch">
          <Box
            minH={{ base: "360px", md: "440px" }}
            borderRadius="lg"
            border="1px solid"
            borderColor="whiteAlpha.300"
            bg={
              nextEvent?.bannerImageUrl
                ? `linear-gradient(90deg, rgba(7,6,16,0.92), rgba(7,6,16,0.36)), url(${nextEvent.bannerImageUrl})`
                : "linear-gradient(135deg, rgba(255,87,160,0.22), rgba(98,72,255,0.18))"
            }
            bgSize="cover"
            bgPos="center"
            p={{ base: 5, md: 8 }}
            display="flex"
            alignItems="end"
          >
            <Box maxW="720px">
              <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
                Fan event calendar
              </Text>
              <Heading size={{ base: "xl", md: "2xl" }} mt={3}>
                {nextEvent ? nextEvent.title : "Fan Events"}
              </Heading>
              <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "lg" }} mt={3} lineHeight="1.7">
                {nextEvent?.summary || "Published fanmeets, cupsleeves, concerts, watch parties, and community schedules will appear here for normal users."}
              </Text>
              {nextEvent && (
                <HStack flexWrap="wrap" mt={5} spacing={3}>
                  <Badge colorScheme={statusColors[nextEvent.status] ?? "purple"} px={3} py={1} borderRadius="md">
                    {nextEvent.status}
                  </Badge>
                  <Badge colorScheme="pink" px={3} py={1} borderRadius="md">
                    {eventTypeLabel(nextEvent.eventType)}
                  </Badge>
                  <Text color="whiteAlpha.850" fontWeight="semibold">
                    {formatDate(nextEvent.startAtUtc)}
                  </Text>
                </HStack>
              )}
            </Box>
          </Box>

          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={{ base: 4, md: 5 }}>
            <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
              Browse
            </Text>
            <Heading size="md" mt={2}>Published Schedules</Heading>
            <Text color="whiteAlpha.760" fontSize="sm" mt={2}>
              This page uses the public published-events feed. Drafts and hidden records stay inside Super Admin.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 1 }} spacing={3} mt={5}>
              <Select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} bg="#151126" borderColor="whiteAlpha.400">
                <option value="upcoming">Upcoming</option>
                <option value="all">All published</option>
                <option value="past">Past</option>
              </Select>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} bg="#151126" borderColor="whiteAlpha.400">
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="open">Open</option>
                <option value="sold-out">Sold Out</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </SimpleGrid>
          </Box>
        </Grid>

        {error && (
          <Alert status="error" borderRadius="md" bg="rgba(130, 28, 64, 0.35)" color="white">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <VStack py={12}>
            <Spinner color="purple.300" />
          </VStack>
        ) : filteredEvents.length === 0 ? (
          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={8} textAlign="center">
            <Heading size="md">No published fan events yet</Heading>
            <Text color="whiteAlpha.750" mt={2}>
              When a super admin publishes an event, normal users will see it here.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
            {[nextEvent, ...remainingEvents].filter(Boolean).map((eventItem) => (
              <FanEventCard key={eventItem!.id} eventItem={eventItem!} />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
}

function FanEventCard({ eventItem }: { eventItem: FanEvent }) {
  return (
    <Box overflow="hidden" border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.075)">
      {eventItem.bannerImageUrl && (
        <Image src={eventItem.bannerImageUrl} alt={eventItem.title} w="100%" h={{ base: "190px", md: "230px" }} objectFit="cover" />
      )}
      <Box p={{ base: 4, md: 5 }}>
        <HStack flexWrap="wrap" spacing={2} mb={3}>
          <Badge colorScheme={statusColors[eventItem.status] ?? "purple"}>{eventItem.status}</Badge>
          <Badge colorScheme="pink">{eventTypeLabel(eventItem.eventType)}</Badge>
          <Badge colorScheme={isUpcoming(eventItem) ? "green" : "gray"}>{isUpcoming(eventItem) ? "Upcoming" : "Past"}</Badge>
        </HStack>

        <Heading size="md">{eventItem.title}</Heading>
        <Text color="whiteAlpha.850" mt={2} lineHeight="1.65">
          {eventItem.summary}
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} mt={4}>
          <Box>
            <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.12em">When</Text>
            <Text color="whiteAlpha.900" mt={1}>{formatDate(eventItem.startAtUtc)}</Text>
            <Text color="whiteAlpha.650" fontSize="sm">until {formatDate(eventItem.endAtUtc)}</Text>
          </Box>
          <Box>
            <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.12em">Where</Text>
            <Text color="whiteAlpha.900" mt={1}>{eventItem.venue || "Venue TBA"}</Text>
            <Text color="whiteAlpha.650" fontSize="sm">{eventItem.location || "Location TBA"}</Text>
          </Box>
        </Grid>

        {eventItem.description && (
          <Text color="whiteAlpha.800" mt={4} whiteSpace="pre-wrap" lineHeight="1.7">
            {eventItem.description}
          </Text>
        )}

        {eventItem.ticketUrl && (
          <Button as="a" href={eventItem.ticketUrl} target="_blank" rel="noopener noreferrer" colorScheme="purple" mt={5}>
            Open Info Link
          </Button>
        )}
      </Box>
    </Box>
  );
}
