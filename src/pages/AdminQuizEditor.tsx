import { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Switch,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { quizApi } from "../services/api/quizApi";
import type { Quiz, QuizQuestion } from "../types/quiz";

interface OptionDraft {
  text: string;
  isCorrect: boolean;
}

export default function AdminQuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState({ prompt: "", points: 1 });
  const [optionDrafts, setOptionDrafts] = useState<Record<number, OptionDraft>>({});

  const parsedQuizId = Number(quizId);

  const loadQuiz = async () => {
    if (!parsedQuizId) return;
    try {
      setQuiz(await quizApi.adminGetQuiz(parsedQuizId));
    } catch {
      setError("Failed to load quiz.");
    }
  };

  useEffect(() => {
    void loadQuiz();
  }, [quizId]);

  const addQuestion = async () => {
    if (!quiz || !questionDraft.prompt.trim()) {
      setError("Question prompt is required.");
      return;
    }

    try {
      await quizApi.adminCreateQuestion(quiz.id, {
        prompt: questionDraft.prompt.trim(),
        sortOrder: quiz.questions.length + 1,
        points: questionDraft.points,
        isActive: true,
      });
      setQuestionDraft({ prompt: "", points: 1 });
      await loadQuiz();
    } catch {
      setError("Failed to create question.");
    }
  };

  const saveQuizSettings = async () => {
    if (!quiz) return;

    try {
      await quizApi.adminUpdateQuiz(quiz.id, {
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description ?? "",
        type: quiz.type,
        isGraded: quiz.isGraded,
        isActive: quiz.isActive,
        startAt: quiz.startAt ?? null,
        endAt: quiz.endAt ?? null,
      });
      await loadQuiz();
    } catch {
      setError("Failed to save quiz settings.");
    }
  };

  const saveQuestionAndOptions = async (question: QuizQuestion) => {
    try {
      await quizApi.adminUpdateQuestion(question.id, {
        prompt: question.prompt,
        explanation: question.explanation ?? "",
        imageUrl: question.imageUrl ?? "",
        audioUrl: question.audioUrl ?? "",
        sortOrder: question.sortOrder,
        points: question.points,
        isActive: true,
      });

      await Promise.all(
        question.options.map((option) =>
          quizApi.adminUpdateOption(option.id, {
            text: option.text,
            sortOrder: option.sortOrder,
            isCorrect: option.isCorrect === true,
          }),
        ),
      );
      await loadQuiz();
    } catch {
      setError("Failed to save question/options.");
    }
  };

  const deleteQuestion = async (questionId: number) => {
    try {
      await quizApi.adminDeleteQuestion(questionId);
      await loadQuiz();
    } catch {
      setError("Failed to delete question.");
    }
  };

  const addOption = async (questionId: number, question: QuizQuestion) => {
    const draft = optionDrafts[questionId];
    if (!draft?.text?.trim()) {
      setError("Option text is required.");
      return;
    }

    try {
      await quizApi.adminCreateOption(questionId, {
        text: draft.text.trim(),
        isCorrect: draft.isCorrect,
        sortOrder: question.options.length + 1,
      });
      setOptionDrafts((prev) => ({ ...prev, [questionId]: { text: "", isCorrect: false } }));
      await loadQuiz();
    } catch {
      setError("Failed to add option.");
    }
  };

  const deleteOption = async (optionId: number) => {
    try {
      await quizApi.adminDeleteOption(optionId);
      await loadQuiz();
    } catch {
      setError("Failed to delete option.");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg" color="white">Quiz Editor</Heading>
          <Button variant="outline" onClick={() => navigate("/admin/quizzes")}>Back to Quiz Manager</Button>
        </HStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {quiz && (
          <>
            <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={5}>
              <Heading size="md" color="white">{quiz.title}</Heading>
              <Text color="whiteAlpha.700">Slug: {quiz.slug}</Text>
              <Text color="whiteAlpha.700">Type: {quiz.type}</Text>

              <VStack mt={4} align="stretch" spacing={3}>
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Title</FormLabel>
                  <Input
                    color="white"
                    value={quiz.title}
                    onChange={(event) => setQuiz((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Slug</FormLabel>
                  <Input
                    color="white"
                    value={quiz.slug}
                    onChange={(event) => setQuiz((prev) => (prev ? { ...prev, slug: event.target.value } : prev))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Type</FormLabel>
                  <Input
                    color="white"
                    value={quiz.type}
                    onChange={(event) => setQuiz((prev) => (prev ? { ...prev, type: event.target.value } : prev))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Description</FormLabel>
                  <Textarea
                    color="white"
                    value={quiz.description ?? ""}
                    onChange={(event) => setQuiz((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                  />
                </FormControl>
                <HStack>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel color="whiteAlpha.900" mb="0">Is Active</FormLabel>
                    <Switch
                      isChecked={quiz.isActive}
                      onChange={(event) => setQuiz((prev) => (prev ? { ...prev, isActive: event.target.checked } : prev))}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel color="whiteAlpha.900" mb="0">Graded</FormLabel>
                    <Switch
                      isChecked={quiz.isGraded}
                      onChange={(event) => setQuiz((prev) => (prev ? { ...prev, isGraded: event.target.checked } : prev))}
                    />
                  </FormControl>
                </HStack>
                <HStack>
                  <FormControl>
                    <FormLabel color="whiteAlpha.900">Start At (UTC)</FormLabel>
                    <Input
                      color="white"
                      type="datetime-local"
                      value={quiz.startAt ? quiz.startAt.slice(0, 16) : ""}
                      onChange={(event) => setQuiz((prev) => (prev ? { ...prev, startAt: event.target.value || null } : prev))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="whiteAlpha.900">End At (UTC)</FormLabel>
                    <Input
                      color="white"
                      type="datetime-local"
                      value={quiz.endAt ? quiz.endAt.slice(0, 16) : ""}
                      onChange={(event) => setQuiz((prev) => (prev ? { ...prev, endAt: event.target.value || null } : prev))}
                    />
                  </FormControl>
                </HStack>
                <Button alignSelf="flex-start" colorScheme="purple" onClick={() => void saveQuizSettings()}>
                  Save Quiz Settings
                </Button>
              </VStack>
            </Box>

            <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={5}>
              <Heading size="md" mb={3} color="white">Add Question</Heading>
              <Stack spacing={3}>
                <Input
                  placeholder="Question prompt"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.600" }}
                  value={questionDraft.prompt}
                  onChange={(e) => setQuestionDraft((prev) => ({ ...prev, prompt: e.target.value }))}
                />
                <FormControl maxW="200px">
                  <FormLabel color="whiteAlpha.900">Points</FormLabel>
                  <NumberInput
                    min={1}
                    value={questionDraft.points}
                    onChange={(_, value) => setQuestionDraft((prev) => ({ ...prev, points: Number.isNaN(value) ? 1 : value }))}
                  >
                    <NumberInputField color="white" />
                  </NumberInput>
                </FormControl>
                <Button colorScheme="purple" onClick={addQuestion}>Add Question</Button>
              </Stack>
            </Box>

            <VStack align="stretch" spacing={4}>
              {quiz.questions.map((question) => (
                <Box key={question.id} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={5}>
                  <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold" color="white">Question #{question.sortOrder}</Text>
                    <Button size="sm" colorScheme="red" onClick={() => void deleteQuestion(question.id)}>Delete Question</Button>
                  </HStack>

                  <VStack align="stretch" spacing={2}>
                    <Textarea
                      color="white"
                      _placeholder={{ color: "whiteAlpha.600" }}
                      value={question.prompt}
                      onChange={(e) =>
                        setQuiz((prev) =>
                          prev
                            ? {
                                ...prev,
                                questions: prev.questions.map((q) => (q.id === question.id ? { ...q, prompt: e.target.value } : q)),
                              }
                            : prev,
                        )
                      }
                    />
                    <HStack>
                      <NumberInput
                        min={1}
                        value={question.points}
                        onChange={(_, value) =>
                          setQuiz((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  questions: prev.questions.map((q) =>
                                    q.id === question.id ? { ...q, points: Number.isNaN(value) ? 1 : value } : q,
                                  ),
                                }
                              : prev,
                          )
                        }
                      >
                        <NumberInputField color="white" />
                      </NumberInput>
                      <Button size="sm" colorScheme="purple" onClick={() => void saveQuestionAndOptions(question)}>Save Question & Options</Button>
                    </HStack>
                  </VStack>

                  <Box mt={4}>
                    <Text fontWeight="semibold" mb={2} color="white">Options</Text>
                    <VStack align="stretch" spacing={2}>
                      {question.options.map((option) => (
                        <HStack key={option.id} align="start">
                          <Input
                            color="white"
                            _placeholder={{ color: "whiteAlpha.600" }}
                            value={option.text}
                            onChange={(e) =>
                              setQuiz((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      questions: prev.questions.map((q) =>
                                        q.id === question.id
                                          ? {
                                              ...q,
                                              options: q.options.map((o) =>
                                                o.id === option.id ? { ...o, text: e.target.value } : o,
                                              ),
                                            }
                                          : q,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                          />
                          <Checkbox
                            isChecked={option.isCorrect === true}
                            onChange={(e) =>
                              setQuiz((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      questions: prev.questions.map((q) =>
                                        q.id === question.id
                                          ? {
                                              ...q,
                                              options: q.options.map((o) =>
                                                o.id === option.id ? { ...o, isCorrect: e.target.checked } : o,
                                              ),
                                            }
                                          : q,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                          >
                            Correct
                          </Checkbox>
                          <Button size="sm" colorScheme="red" onClick={() => void deleteOption(option.id)}>
                            Delete
                          </Button>
                        </HStack>
                      ))}
                    </VStack>

                    <HStack mt={3}>
                      <Input
                        placeholder="Add option text"
                        color="white"
                        _placeholder={{ color: "whiteAlpha.600" }}
                        value={optionDrafts[question.id]?.text ?? ""}
                        onChange={(e) =>
                          setOptionDrafts((prev) => ({
                            ...prev,
                            [question.id]: { text: e.target.value, isCorrect: prev[question.id]?.isCorrect ?? false },
                          }))
                        }
                      />
                      <Checkbox
                        isChecked={optionDrafts[question.id]?.isCorrect ?? false}
                        onChange={(e) =>
                          setOptionDrafts((prev) => ({
                            ...prev,
                            [question.id]: { text: prev[question.id]?.text ?? "", isCorrect: e.target.checked },
                          }))
                        }
                      >
                        Correct
                      </Checkbox>
                      <Button size="sm" onClick={() => void addOption(question.id, question)}>Add Option</Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
