import { useEffect, useState } from "react";
import { Alert, AlertIcon, Box, Heading, Spinner, Tab, TabList, TabPanel, TabPanels, Table, Tabs, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
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
          quizApi.getLeaderboard(true, 20),
          quizApi.getLeaderboard(false, 20),
        ]);

        if (gradedResult.status === "fulfilled") {
          setGradedLeaderboard(gradedResult.value);
        } else {
          setGradedLeaderboard([]);
        }

        if (practiceResult.status === "fulfilled") {
          setPracticeLeaderboard(practiceResult.value);
        } else {
          setPracticeLeaderboard([]);
        }

        if (gradedResult.status === "rejected" && practiceResult.status === "rejected") {
          setError("Failed to load leaderboards.");
        } else {
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Quiz Leaderboards</Heading>
        <Text color="whiteAlpha.700">Compare top fans by total quiz score for graded and practice quizzes.</Text>

        {loading && (
          <VStack py={8}>
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
          <Tabs variant="enclosed">
            <TabList>
              <Tab color="whiteAlpha.900" _selected={{ color: "white", borderColor: "purple.300" }}>Graded</Tab>
              <Tab color="whiteAlpha.900" _selected={{ color: "white", borderColor: "purple.300" }}>Practice</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <LeaderboardTable rows={gradedLeaderboard} />
              </TabPanel>
              <TabPanel px={0}>
                <LeaderboardTable rows={practiceLeaderboard} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>
    </Box>
  );
}

function LeaderboardTable({ rows }: { rows: QuizLeaderboardEntry[] }) {
  if (rows.length === 0) {
    return <Text color="whiteAlpha.700">No leaderboard entries yet.</Text>;
  }

  return (
    <Table size="sm">
      <Thead>
        <Tr>
          <Th color="whiteAlpha.900">#</Th>
          <Th color="whiteAlpha.900">User</Th>
          <Th color="whiteAlpha.900" isNumeric>Total Score</Th>
          <Th color="whiteAlpha.900" isNumeric>Correct</Th>
          <Th color="whiteAlpha.900" isNumeric>Attempts</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((entry) => (
          <Tr key={entry.userId}>
            <Td color="white">{entry.rank}</Td>
            <Td color="white">{entry.username}</Td>
            <Td color="white" isNumeric>{entry.totalScore}</Td>
            <Td color="white" isNumeric>{entry.totalCorrectAnswers}</Td>
            <Td color="white" isNumeric>{entry.attemptsCount}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
