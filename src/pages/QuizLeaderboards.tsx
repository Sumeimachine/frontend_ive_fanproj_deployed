import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { quizApi } from "../services/api/quizApi";
import type { QuizLeaderboardEntry } from "../types/quiz";

export default function QuizLeaderboards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradedLeaderboard, setGradedLeaderboard] = useState<QuizLeaderboardEntry[]>([]);
  const [practiceLeaderboard, setPracticeLeaderboard] = useState<QuizLeaderboardEntry[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [gradedResult, practiceResult] = await Promise.allSettled([
          quizApi.getLeaderboard(true, 50),
          quizApi.getLeaderboard(false, 50),
        ]);

        setGradedLeaderboard(gradedResult.status === "fulfilled" ? gradedResult.value : []);
        setPracticeLeaderboard(practiceResult.status === "fulfilled" ? practiceResult.value : []);

        setError(
          gradedResult.status === "rejected" && practiceResult.status === "rejected"
            ? "Failed to load leaderboards."
            : null,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box minH="100vh" color="white" bg="linear-gradient(135deg, #080612, #151126 52%, #251333)" p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6} maxW="1180px" mx="auto">
        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={{ base: 5, md: 7 }}>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            Quiz rankings
          </Text>
          <Heading size={{ base: "xl", md: "2xl" }} mt={2}>
            Leaderboards
          </Heading>
          <Text color="whiteAlpha.800" mt={3} maxW="760px">
            Compare total score, correct answers, and counted attempts across graded and practice quizzes.
          </Text>
        </Box>

        {loading && (
          <VStack py={12}>
            <Spinner color="purple.300" />
          </VStack>
        )}

        {!!error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Tabs variant="unstyled">
            <TabList gap={3} flexWrap="wrap">
              <Tab color="whiteAlpha.850" border="1px solid" borderColor="whiteAlpha.300" borderRadius="md" _selected={{ color: "white", bg: "purple.600", borderColor: "purple.300" }}>
                Graded
              </Tab>
              <Tab color="whiteAlpha.850" border="1px solid" borderColor="whiteAlpha.300" borderRadius="md" _selected={{ color: "white", bg: "purple.600", borderColor: "purple.300" }}>
                Practice
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={5}>
                <LeaderboardBoard rows={gradedLeaderboard} modeLabel="Graded" />
              </TabPanel>
              <TabPanel px={0} pt={5}>
                <LeaderboardBoard rows={practiceLeaderboard} modeLabel="Practice" />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>
    </Box>
  );
}

function LeaderboardBoard({ rows, modeLabel }: { rows: QuizLeaderboardEntry[]; modeLabel: string }) {
  const podium = useMemo(() => rows.slice(0, 3), [rows]);

  if (rows.length === 0) {
    return (
      <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={8} textAlign="center">
        <Heading size="md">No {modeLabel.toLowerCase()} entries yet</Heading>
        <Text color="whiteAlpha.700" mt={2}>
          Scores will appear after users complete published quizzes.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={5}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {podium.map((entry) => (
          <PodiumCard key={entry.userId} entry={entry} />
        ))}
      </SimpleGrid>

      <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" overflowX="auto">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th color="whiteAlpha.900">Rank</Th>
              <Th color="whiteAlpha.900">User</Th>
              <Th color="whiteAlpha.900" isNumeric>Total Score</Th>
              <Th color="whiteAlpha.900" isNumeric>Correct</Th>
              <Th color="whiteAlpha.900" isNumeric>Attempts</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((entry) => (
              <Tr key={entry.userId}>
                <Td color="white">
                  <Badge colorScheme={entry.rank <= 3 ? "pink" : "purple"}>#{entry.rank}</Badge>
                </Td>
                <Td color="white" fontWeight="semibold">{entry.username}</Td>
                <Td color="white" isNumeric>{entry.totalScore}</Td>
                <Td color="white" isNumeric>{entry.totalCorrectAnswers}</Td>
                <Td color="white" isNumeric>{entry.attemptsCount}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}

function PodiumCard({ entry }: { entry: QuizLeaderboardEntry }) {
  return (
    <Box border="1px solid" borderColor={entry.rank === 1 ? "pink.300" : "whiteAlpha.300"} borderRadius="lg" bg="rgba(255,255,255,0.075)" p={5}>
      <HStack justify="space-between" align="start">
        <Box>
          <Badge colorScheme={entry.rank === 1 ? "pink" : "purple"} mb={3}>
            Rank #{entry.rank}
          </Badge>
          <Heading size="md">{entry.username}</Heading>
        </Box>
        <Text color="pink.200" fontSize="2xl" fontWeight="bold">
          {entry.totalScore}
        </Text>
      </HStack>

      <Grid templateColumns="1fr 1fr" gap={3} mt={5}>
        <MiniStat label="Correct" value={entry.totalCorrectAnswers.toString()} />
        <MiniStat label="Attempts" value={entry.attemptsCount.toString()} />
      </Grid>
    </Box>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Box border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={3}>
      <Text color="whiteAlpha.650" fontSize="xs" textTransform="uppercase" letterSpacing="0.1em">
        {label}
      </Text>
      <Text color="white" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
