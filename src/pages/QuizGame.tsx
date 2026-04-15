import { useEffect, useMemo, useState } from "react";
import { Alert, AlertIcon, Box, Button, Heading, Radio, RadioGroup, Spinner, Stack, Text, VStack } from "@chakra-ui/react";
import { quizApi } from "../services/api/quizApi";
import { useAuth } from "../context/AuthContext";
import type { Quiz, QuizSubmitResult } from "../types/quiz";

export default function QuizGame() {
  const { bootstrapProfile } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        let fallbackMessage: string | null = null;

        let res = await quizApi.getActiveQuiz("daily");
        if ("message" in res) {
          const fallbackTypes = ["trivia", "practice", "event"];
          for (const type of fallbackTypes) {
            const fallbackQuiz = await quizApi.getActiveQuiz(type);
            if (!("message" in fallbackQuiz)) {
              res = fallbackQuiz;
              fallbackMessage = `No active daily quiz found. Showing active ${fallbackQuiz.type} quiz instead.`;
              break;
            }
          }
        }

        if ("message" in res) {
          setMessage(res.message);
          setQuiz(null);
        } else {
          setQuiz(res);
          setMessage(fallbackMessage);
        }
      } catch (error) {
        setMessage("Unable to load quiz right now.");
      } finally {
        setLoading(false);
      }
    })();

  }, []);

  const totalQuestions = useMemo(() => quiz?.questions.length ?? 0, [quiz]);

  const onSubmit = async () => {
    if (!quiz) return;

    const payload = Object.entries(answers).map(([questionId, answerOptionId]) => ({
      questionId: Number(questionId),
      answerOptionId,
    }));

    if (payload.length !== totalQuestions) {
      setMessage("Please answer all questions first.");
      return;
    }

    try {
      const submitResult = await quizApi.submitAttempt(quiz.id, payload);
      setResult(submitResult);
      setMessage(null);
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

  if (message && !quiz) {
    return (
      <Box p={6}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          {message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color="white">Daily IVE Quiz</Heading>
        <Text color="white" fontSize="lg" fontWeight="semibold">{quiz?.title}</Text>
        <Text color="whiteAlpha.900">Quiz Type: {quiz?.type}</Text>
        <Text color="whiteAlpha.900">
          Mode: {quiz?.isGraded ? "Graded (earns 1 currency per correct answer)" : "Practice (no currency reward)"}
        </Text>

        {quiz?.questions.map((question, questionIndex) => (
          <Box key={question.id} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
            <Text fontWeight="bold" mb={3} color="white">
              {questionIndex + 1}. {question.prompt}
            </Text>

            <RadioGroup
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: Number(value) }))}
              value={answers[question.id]?.toString() ?? ""}
            >
              <Stack>
                {question.options.map((option) => (
                  <Radio key={option.id} value={option.id.toString()}>
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
          Submit Quiz
        </Button>

        {result && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            Score: {result.score} | Correct: {result.correctAnswers}/{result.totalQuestions} | Currency Earned: +{result.currencyAwarded} | Balance: {result.currencyBalance}
          </Alert>
        )}

      </VStack>
    </Box>
  );
}
