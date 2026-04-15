import { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { quizApi } from "../services/api/quizApi";
import type { QuizAdminSummary } from "../types/quiz";

const defaultQuizForm = {
  title: "",
  slug: "",
  description: "",
  type: "daily",
  isGraded: true,
  isActive: true,
  startAt: "",
  endAt: "",
};

export default function AdminQuizManager() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizAdminSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultQuizForm);

  const loadQuizzes = async () => {
    try {
      setQuizzes(await quizApi.adminList());
    } catch {
      setError("Unable to load quizzes.");
    }
  };

  useEffect(() => {
    void loadQuizzes();
  }, []);

  const createQuiz = async () => {
    try {
      await quizApi.adminCreateQuiz({
        ...form,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      });
      setForm(defaultQuizForm);
      setError(null);
      await loadQuizzes();
    } catch {
      setError("Create quiz failed.");
    }
  };

  const publishQuiz = async (quizId: number, isPublished: boolean) => {
    try {
      await quizApi.adminSetPublished(quizId, isPublished);
      await loadQuizzes();
    } catch {
      setError("Publish update failed. Ensure quiz has valid questions/options.");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={8}>
        <Heading size="lg" color="white">Admin Quiz Manager</Heading>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={5}>
          <Heading size="md" mb={4} color="white">Create Quiz</Heading>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Title</FormLabel>
              <Input color="white" _placeholder={{ color: "whiteAlpha.600" }} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Slug</FormLabel>
              <Input color="white" _placeholder={{ color: "whiteAlpha.600" }} value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                Slug = unique URL key, e.g. <strong>ive-daily-2026-04-14</strong>. Use lowercase letters, numbers, and dashes.
              </Text>
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Type</FormLabel>
              <Input color="white" _placeholder={{ color: "whiteAlpha.600" }} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Graded (Currency)</FormLabel>
              <Switch
                isChecked={form.isGraded}
                onChange={(e) => setForm((p) => ({ ...p, isGraded: e.target.checked }))}
              />
              <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                Graded quizzes award 1 currency per correct answer.
              </Text>
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Is Active</FormLabel>
              <Switch isChecked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Start At (UTC)</FormLabel>
              <Input color="white" type="datetime-local" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">End At (UTC)</FormLabel>
              <Input color="white" type="datetime-local" value={form.endAt} onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))} />
            </FormControl>
          </Grid>
          <FormControl mt={4}>
            <FormLabel color="whiteAlpha.900">Description</FormLabel>
            <Textarea color="white" _placeholder={{ color: "whiteAlpha.600" }} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </FormControl>
          <Button mt={4} colorScheme="purple" onClick={createQuiz}>Create</Button>
        </Box>

        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={5}>
          <Heading size="md" mb={4} color="white">Quizzes</Heading>
          <VStack align="stretch">
            {quizzes.map((quiz) => (
              <Box key={quiz.id} border="1px solid" borderColor="whiteAlpha.200" p={3} borderRadius="md">
                <Text fontWeight="bold" color="white">{quiz.title}</Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  {quiz.type} · {quiz.questionCount} questions · {quiz.isGraded ? "graded" : "practice"}
                </Text>
                <HStack mt={2}>
                  <Button size="sm" onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}>Manage</Button>
                  <Button
                    size="sm"
                    colorScheme={quiz.isPublished ? "orange" : "green"}
                    onClick={() => void publishQuiz(quiz.id, !quiz.isPublished)}
                  >
                    {quiz.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => void quizApi.adminDeleteQuiz(quiz.id).then(loadQuizzes)}>Delete</Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}
