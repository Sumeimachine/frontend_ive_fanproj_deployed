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
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { quizApi } from "../services/api/quizApi";
import { useAuth } from "../context/AuthContext";
import type { Quiz, QuizQuestion, QuizSubmitResult } from "../types/quiz";

const isVideoMediaUrl = (url?: string | null) => !!url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

const fieldStyles = {
  bg: "#151126",
  color: "white",
  borderColor: "whiteAlpha.400",
  _hover: { borderColor: "purple.300" },
  _focusVisible: {
    borderColor: "purple.300",
    boxShadow: "0 0 0 1px rgba(196, 146, 255, 0.75)",
  },
  sx: {
    option: {
      bg: "#151126",
      color: "white",
    },
  },
};

function formatWindow(value?: string | null) {
  if (!value) return "Open now";
  return new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function QuizGame() {
  const { bootstrapProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  useEffect(() => {
    void loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await quizApi.getActiveQuizzes();

      if ("message" in res) {
        setMessage(res.message);
        setQuizzes([]);
        setSelectedQuizId(null);
      } else {
        setQuizzes(res);
        setSelectedQuizId((current) => current ?? res[0]?.id ?? null);
        setMessage(null);
      }
    } catch {
      setMessage("Unable to load quizzes right now.");
    } finally {
      setLoading(false);
    }
  };

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  const totalQuestions = selectedQuiz?.questions.length ?? 0;
  const answeredCount = selectedQuiz?.questions.filter((question) => answers[question.id]).length ?? 0;
  const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const selectedQuizMaxScore = selectedQuiz?.questions.reduce((sum, question) => sum + question.points, 0) ?? 0;

  const handleQuizChange = (quizId: number) => {
    setSelectedQuizId(quizId);
    setAnswers({});
    setResult(null);
    setMessage(null);
  };

  const chooseAnswer = (questionId: number, optionId: number) => {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    if (message === "Please answer all questions first.") {
      setMessage(null);
    }
  };

  const onSubmit = async () => {
    if (!selectedQuiz) return;

    const payload = selectedQuiz.questions
      .filter((question) => answers[question.id])
      .map((question) => ({
        questionId: question.id,
        answerOptionId: answers[question.id],
      }));

    if (payload.length !== totalQuestions) {
      setMessage("Please answer all questions first.");
      return;
    }

    try {
      setSubmitting(true);
      const submitResult = await quizApi.submitAttempt(selectedQuiz.id, payload);
      setResult(submitResult);
      setMessage(submitResult.message);
      await bootstrapProfile();
      await loadQuizzes();
    } catch {
      setMessage("Submit failed. Refresh the quiz list and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="#080612" color="white">
        <VStack py={16}>
          <Spinner color="purple.300" />
        </VStack>
      </Box>
    );
  }

  if (!selectedQuiz) {
    return (
      <Box minH="100vh" p={{ base: 4, md: 8 }} bg="#080612" color="white">
        <Alert status="info" borderRadius="md" bg="rgba(104,62,170,0.2)" color="white">
          <AlertIcon />
          {message ?? "No active quiz available right now."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box minH="100vh" color="white" bg="linear-gradient(135deg, #080612, #151126 52%, #251333)" p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6} maxW="1180px" mx="auto">
        <Grid templateColumns={{ base: "1fr", xl: "1fr 340px" }} gap={5} alignItems="stretch">
          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={{ base: 5, md: 7 }}>
            <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
              IVE quiz stage
            </Text>
            <Heading size={{ base: "xl", md: "2xl" }} mt={2}>
              {selectedQuiz.title}
            </Heading>
            {selectedQuiz.description && (
              <Text color="whiteAlpha.850" mt={3} maxW="760px" lineHeight="1.7">
                {selectedQuiz.description}
              </Text>
            )}
            <HStack flexWrap="wrap" spacing={3} mt={5}>
              <Badge colorScheme={selectedQuiz.isGraded ? "pink" : "purple"} px={3} py={1} borderRadius="md">
                {selectedQuiz.isGraded ? "Graded" : "Practice"}
              </Badge>
              <Badge colorScheme="purple" px={3} py={1} borderRadius="md">
                {selectedQuiz.type}
              </Badge>
              <Badge colorScheme={selectedQuiz.hasCompletedFirstAttempt ? "yellow" : "green"} px={3} py={1} borderRadius="md">
                {selectedQuiz.hasCompletedFirstAttempt ? "Retake mode" : "First attempt"}
              </Badge>
            </HStack>
          </Box>

          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={5}>
            <VStack align="stretch" spacing={4}>
              {quizzes.length > 1 && (
                <Box>
                  <Text color="whiteAlpha.850" fontWeight="semibold" mb={2}>
                    Select quiz
                  </Text>
                  <Select value={selectedQuiz.id} onChange={(event) => handleQuizChange(Number(event.target.value))} {...fieldStyles}>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.type})
                      </option>
                    ))}
                  </Select>
                </Box>
              )}

              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text color="whiteAlpha.850" fontWeight="semibold">Progress</Text>
                  <Text color="pink.200">{answeredCount}/{totalQuestions}</Text>
                </HStack>
                <Progress value={completionPercent} colorScheme="pink" bg="whiteAlpha.200" borderRadius="full" />
              </Box>

              <SimpleGrid columns={2} spacing={3}>
                <StatBox label="Max Score" value={selectedQuizMaxScore.toString()} />
                <StatBox label="Attempts" value={selectedQuiz.attemptCount.toString()} />
              </SimpleGrid>

              <Text color="whiteAlpha.700" fontSize="sm">
                Active until: {formatWindow(selectedQuiz.endAt)}
              </Text>
            </VStack>
          </Box>
        </Grid>

        {selectedQuiz.hasCompletedFirstAttempt && (
          <Alert status="info" borderRadius="md" bg="rgba(104,62,170,0.24)" color="white">
            <AlertIcon />
            You already completed this quiz once. You can retake for fun, but score and rewards are locked after the first counted attempt.
          </Alert>
        )}

        <VStack align="stretch" spacing={4}>
          {selectedQuiz.questions.map((question, questionIndex) => (
            <QuestionPanel
              key={question.id}
              question={question}
              questionIndex={questionIndex}
              selectedOptionId={answers[question.id]}
              onSelect={(optionId) => chooseAnswer(question.id, optionId)}
            />
          ))}
        </VStack>

        {!!message && (
          <Alert status={result ? (result.isScoreCounted ? "success" : "warning") : "warning"} borderRadius="md">
            <AlertIcon />
            {message}
          </Alert>
        )}

        {result && (
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
            <StatBox label="Score" value={`${result.score}/${selectedQuizMaxScore}`} />
            <StatBox label="Correct" value={`${result.correctAnswers}/${result.totalQuestions}`} />
            <StatBox label="Earned" value={`+${result.currencyAwarded}`} />
            <StatBox label="Balance" value={result.currencyBalance.toString()} />
          </SimpleGrid>
        )}

        <Button
          colorScheme="purple"
          size="lg"
          onClick={() => void onSubmit()}
          isLoading={submitting}
          isDisabled={answeredCount !== totalQuestions}
        >
          {selectedQuiz.hasCompletedFirstAttempt ? "Retake Quiz (score locked)" : "Submit Quiz"}
        </Button>
      </VStack>
    </Box>
  );
}

function QuestionPanel({
  question,
  questionIndex,
  selectedOptionId,
  onSelect,
}: {
  question: QuizQuestion;
  questionIndex: number;
  selectedOptionId?: number;
  onSelect: (optionId: number) => void;
}) {
  return (
    <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.065)" p={{ base: 4, md: 5 }}>
      <HStack justify="space-between" align="start" gap={4} mb={4}>
        <Box>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.12em">
            Question {questionIndex + 1}
          </Text>
          <Heading size="md" mt={1}>
            {question.prompt}
          </Heading>
        </Box>
        <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
          {question.points} pt{question.points === 1 ? "" : "s"}
        </Badge>
      </HStack>

      {!!question.imageUrl && (
        <Box mb={4}>
          {isVideoMediaUrl(question.imageUrl) ? (
            <Box as="video" src={question.imageUrl} controls w="100%" maxH="360px" borderRadius="md" />
          ) : (
            <Image src={question.imageUrl} alt={`Question ${questionIndex + 1}`} w="100%" maxH="360px" objectFit="cover" borderRadius="md" />
          )}
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <Button
              key={option.id}
              variant={isSelected ? "solid" : "outline"}
              colorScheme={isSelected ? "pink" : "purple"}
              justifyContent="flex-start"
              h="auto"
              minH="58px"
              whiteSpace="normal"
              textAlign="left"
              px={4}
              py={3}
              onClick={() => onSelect(option.id)}
            >
              <HStack align="center" spacing={3} w="100%">
                {option.imageUrl && (
                  isVideoMediaUrl(option.imageUrl) ? (
                    <Box as="video" src={option.imageUrl} controls h="64px" w="86px" objectFit="cover" borderRadius="md" />
                  ) : (
                    <Image src={option.imageUrl} alt={option.text || "Option image"} h="64px" w="86px" objectFit="cover" borderRadius="md" />
                  )
                )}
                <Text flex="1">{option.text}</Text>
              </HStack>
            </Button>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box border="1px solid" borderColor="whiteAlpha.200" bg="rgba(255,255,255,0.07)" borderRadius="md" p={3}>
      <Text color="whiteAlpha.650" fontSize="xs" textTransform="uppercase" letterSpacing="0.1em">
        {label}
      </Text>
      <Text color="white" fontSize="xl" fontWeight="bold">
        {value}
      </Text>
    </Box>
  );
}
