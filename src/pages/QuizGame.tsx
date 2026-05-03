import { useEffect, useMemo, useState } from "react";
import { Alert, AlertIcon, Box, Button, Heading, Image, Radio, RadioGroup, Select, Spinner, Stack, Text, VStack } from "@chakra-ui/react";
import { quizApi } from "../services/api/quizApi";
import { useAuth } from "../context/AuthContext";
import type { Quiz, QuizSubmitResult } from "../types/quiz";

const isVideoMediaUrl = (url?: string | null) => !!url && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

export default function QuizGame() {
  const { bootstrapProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await quizApi.getActiveQuizzes();

        if ("message" in res) {
          setMessage(res.message);
          setQuizzes([]);
          setSelectedQuizId(null);
        } else {
          setQuizzes(res);
          setSelectedQuizId(res[0]?.id ?? null);
          setMessage(null);
        }
      } catch (error) {
        setMessage("Unable to load quiz right now.");
      } finally {
        setLoading(false);
      }
    })();

  }, []);

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  const totalQuestions = useMemo(() => selectedQuiz?.questions.length ?? 0, [selectedQuiz]);

  const handleQuizChange = (quizId: number) => {
    setSelectedQuizId(quizId);
    setAnswers({});
    setResult(null);
    setMessage(null);
  };

  const onSubmit = async () => {
    if (!selectedQuiz) return;

    const payload = Object.entries(answers).map(([questionId, answerOptionId]) => ({
      questionId: Number(questionId),
      answerOptionId,
    }));

    if (payload.length !== totalQuestions) {
      setMessage("Please answer all questions first.");
      return;
    }

    try {
      const submitResult = await quizApi.submitAttempt(selectedQuiz.id, payload);
      setResult(submitResult);
      setMessage(submitResult.message);
      await bootstrapProfile();
    } catch (error) {
      setMessage("Submit failed. Daily quiz may already be answered.");
    }
  };

  if (loading) {
    return (
      <VStack py={16}>
        <Spinner color="purple.300" />
      </VStack>
    );
  }

  if (message && !selectedQuiz) {
    return (
      <Box p={6}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          {message}
        </Alert>
      </Box>
    );
  }

  if (!selectedQuiz) {
    return (
      <Box p={6}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          No active quiz available right now.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color="white">IVE Quizzes</Heading>
        {quizzes.length > 1 && (
          <Box>
            <Text color="whiteAlpha.900" mb={2}>Select a quiz:</Text>
            <Select
              value={selectedQuiz?.id ?? ""}
              onChange={(event) => handleQuizChange(Number(event.target.value))}
              bg="whiteAlpha.100"
              color="white"
              borderColor="whiteAlpha.300"
            >
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id} style={{ color: "black" }}>
                  {quiz.title} ({quiz.type})
                </option>
              ))}
            </Select>
          </Box>
        )}
        <Text color="white" fontSize="lg" fontWeight="semibold">{selectedQuiz?.title}</Text>
        <Text color="whiteAlpha.900">Quiz Type: {selectedQuiz?.type}</Text>
        <Text color="whiteAlpha.900">
          Mode: {selectedQuiz?.isGraded ? "Graded (earns 1 currency per correct answer)" : "Practice (no currency reward)"}
        </Text>
        {selectedQuiz?.hasCompletedFirstAttempt && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            You already completed this quiz once. You can retake for fun, but only your first attempt is counted.
          </Alert>
        )}

        {selectedQuiz?.questions.map((question, questionIndex) => (
          <Box key={question.id} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
            <Text fontWeight="bold" mb={3} color="white">
              {questionIndex + 1}. {question.prompt}
            </Text>
            {!!question.imageUrl && (
              isVideoMediaUrl(question.imageUrl)
                ? <Box as="video" src={question.imageUrl} controls maxW="260px" borderRadius="md" mb={3} />
                : <Image src={question.imageUrl} alt={`Question ${questionIndex + 1}`} maxW="260px" borderRadius="md" mb={3} />
            )}

            <RadioGroup
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: Number(value) }))}
              value={answers[question.id]?.toString() ?? ""}
            >
              <Stack>
                {question.options.map((option) => (
                  <Radio key={option.id} value={option.id.toString()}>
                    {!!option.imageUrl && (
                      isVideoMediaUrl(option.imageUrl)
                        ? <Box as="video" src={option.imageUrl} controls maxW="180px" borderRadius="md" mb={1} />
                        : <Image src={option.imageUrl} alt={option.text} maxW="180px" borderRadius="md" mb={1} />
                    )}
                    <Text color="whiteAlpha.900">{option.text}</Text>
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </Box>
        ))}

        {!!message && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            {message}
          </Alert>
        )}

        <Button colorScheme="purple" onClick={onSubmit}>
          {selectedQuiz?.hasCompletedFirstAttempt ? "Retake Quiz (score locked)" : "Submit Quiz"}
        </Button>

        {result && (
          <Alert status={result.isScoreCounted ? "success" : "warning"} borderRadius="md">
            <AlertIcon />
            Score: {result.score} | Correct: {result.correctAnswers}/{result.totalQuestions} | Currency Earned: +{result.currencyAwarded} | Balance: {result.currencyBalance}
          </Alert>
        )}

      </VStack>
    </Box>
  );
}
