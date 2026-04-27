import { useEffect, useRef, useState } from "react";
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
  Image,
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
import { mediaApi } from "../services/api/mediaApi";
import type { Quiz, QuizQuestion } from "../types/quiz";

interface OptionDraft {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "message" in responseData &&
    typeof (responseData as { message?: unknown }).message === "string"
  ) {
    return (responseData as { message: string }).message;
  }

  return fallback;
};

export default function AdminQuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState({ prompt: "", points: 1 });
  const [optionDrafts, setOptionDrafts] = useState<Record<number, OptionDraft>>({});
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const questionFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const optionFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
            imageUrl: option.imageUrl ?? "",
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
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to delete question."));
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
        imageUrl: draft.imageUrl ?? "",
        isCorrect: draft.isCorrect,
        sortOrder: question.options.length + 1,
      });
      setOptionDrafts((prev) => ({ ...prev, [questionId]: { text: "", isCorrect: false, imageUrl: "" } }));
      await loadQuiz();
    } catch {
      setError("Failed to add option.");
    }
  };

  const deleteOption = async (optionId: number) => {
    try {
      await quizApi.adminDeleteOption(optionId);
      await loadQuiz();
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to delete option."));
    }
  };

  const uploadImageForQuestion = async (questionId: number, file: File) => {
    try {
      setUploadingTarget(`question-${questionId}`);
      const upload = await mediaApi.uploadImage(file, "quiz");
      setQuiz((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((question) =>
                question.id === questionId ? { ...question, imageUrl: upload.url } : question,
              ),
            }
          : prev,
      );
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to upload question image."));
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeQuestionImage = async (question: QuizQuestion) => {
    if (!question.imageUrl) return;

    try {
      await mediaApi.deleteImageByUrl(question.imageUrl);
      setQuiz((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((item) => (item.id === question.id ? { ...item, imageUrl: "" } : item)),
            }
          : prev,
      );
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to delete question image."));
    }
  };

  const uploadImageForOptionDraft = async (questionId: number, file: File) => {
    try {
      setUploadingTarget(`option-draft-${questionId}`);
      const upload = await mediaApi.uploadImage(file, "quiz");
      setOptionDrafts((prev) => ({
        ...prev,
        [questionId]: { text: prev[questionId]?.text ?? "", isCorrect: prev[questionId]?.isCorrect ?? false, imageUrl: upload.url },
      }));
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to upload option image."));
    } finally {
      setUploadingTarget(null);
    }
  };

  const uploadImageForOption = async (questionId: number, optionId: number, file: File) => {
    try {
      setUploadingTarget(`option-${optionId}`);
      const upload = await mediaApi.uploadImage(file, "quiz");
      setQuiz((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      options: question.options.map((option) =>
                        option.id === optionId ? { ...option, imageUrl: upload.url } : option,
                      ),
                    }
                  : question,
              ),
            }
          : prev,
      );
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to upload option image."));
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeOptionImage = async (questionId: number, optionId: number, url?: string | null) => {
    if (!url) return;

    try {
      await mediaApi.deleteImageByUrl(url);
      setQuiz((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      options: question.options.map((option) =>
                        option.id === optionId ? { ...option, imageUrl: "" } : option,
                      ),
                    }
                  : question,
              ),
            }
          : prev,
      );
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to delete option image."));
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
                    {!!question.imageUrl && (
                      <Image src={question.imageUrl} alt={`Question ${question.sortOrder}`} maxW="220px" borderRadius="md" />
                    )}
                    <HStack flexWrap="wrap">
                      <Input
                        type="file"
                        accept="image/*"
                        display="none"
                        ref={(element) => {
                          questionFileRefs.current[question.id] = element;
                        }}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void uploadImageForQuestion(question.id, file);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => questionFileRefs.current[question.id]?.click()}
                        isLoading={uploadingTarget === `question-${question.id}`}
                      >
                        Upload Question Image
                      </Button>
                      {!!question.imageUrl && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => void removeQuestionImage(question)}
                        >
                          Delete Question Image
                        </Button>
                      )}
                    </HStack>
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
                        <VStack key={option.id} align="stretch" border="1px solid" borderColor="whiteAlpha.200" borderRadius="md" p={3}>
                          <HStack align="start">
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
                          {!!option.imageUrl && (
                            <Image src={option.imageUrl} alt={`Option ${option.id}`} maxW="180px" borderRadius="md" />
                          )}
                          <HStack flexWrap="wrap">
                            <Input
                              type="file"
                              accept="image/*"
                              display="none"
                              ref={(element) => {
                                optionFileRefs.current[option.id] = element;
                              }}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void uploadImageForOption(question.id, option.id, file);
                                }
                                event.currentTarget.value = "";
                              }}
                            />
                            <Button
                              size="xs"
                              onClick={() => optionFileRefs.current[option.id]?.click()}
                              isLoading={uploadingTarget === `option-${option.id}`}
                            >
                              Upload Option Image
                            </Button>
                            {!!option.imageUrl && (
                              <Button
                                size="xs"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => void removeOptionImage(question.id, option.id, option.imageUrl)}
                              >
                                Delete Option Image
                              </Button>
                            )}
                          </HStack>
                        </VStack>
                      ))}
                    </VStack>

                    <VStack align="stretch" mt={3} spacing={3}>
                      <Input
                        placeholder="Add option text"
                        color="white"
                        _placeholder={{ color: "whiteAlpha.600" }}
                        value={optionDrafts[question.id]?.text ?? ""}
                        onChange={(e) =>
                          setOptionDrafts((prev) => ({
                            ...prev,
                            [question.id]: {
                              text: e.target.value,
                              isCorrect: prev[question.id]?.isCorrect ?? false,
                              imageUrl: prev[question.id]?.imageUrl ?? "",
                            },
                          }))
                        }
                      />
                      {!!optionDrafts[question.id]?.imageUrl && (
                        <Image src={optionDrafts[question.id]?.imageUrl} alt="Draft option preview" maxW="180px" borderRadius="md" />
                      )}
                      <HStack>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void uploadImageForOptionDraft(question.id, file);
                            }
                            event.currentTarget.value = "";
                          }}
                          p={1}
                        />
                        {!!optionDrafts[question.id]?.imageUrl && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() =>
                              setOptionDrafts((prev) => ({
                                ...prev,
                                [question.id]: {
                                  text: prev[question.id]?.text ?? "",
                                  isCorrect: prev[question.id]?.isCorrect ?? false,
                                  imageUrl: "",
                                },
                              }))
                            }
                          >
                            Clear Draft Image
                          </Button>
                        )}
                      </HStack>
                      <HStack>
                        <Checkbox
                          isChecked={optionDrafts[question.id]?.isCorrect ?? false}
                          onChange={(e) =>
                            setOptionDrafts((prev) => ({
                              ...prev,
                              [question.id]: {
                                text: prev[question.id]?.text ?? "",
                                isCorrect: e.target.checked,
                                imageUrl: prev[question.id]?.imageUrl ?? "",
                              },
                            }))
                          }
                        >
                          Correct
                        </Checkbox>
                        <Button size="sm" onClick={() => void addOption(question.id, question)}>Add Option</Button>
                      </HStack>
                    </VStack>
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
