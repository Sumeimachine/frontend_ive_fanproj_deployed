import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  GridItem,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { mediaApi, type MediaLibraryFile } from "../services/api/mediaApi";

interface MediaPickerModalProps {
  buttonLabel: string;
  folder?: string;
  size?: "xs" | "sm" | "md" | "lg";
  onSelect: (url: string) => void;
}

export default function MediaPickerModal({ buttonLabel, folder, size = "sm", onSelect }: MediaPickerModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [files, setFiles] = useState<MediaLibraryFile[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await mediaApi.getLibrary();
        setFiles(response.files);
      } catch {
        setError("Unable to load media library.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen]);

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => !folder || file.folder === folder)
      .filter((file) => {
        if (!search.trim()) return true;
        const keyword = search.trim().toLowerCase();
        return file.fileName.toLowerCase().includes(keyword) || file.folder.toLowerCase().includes(keyword);
      });
  }, [files, folder, search]);

  return (
    <>
      <Button size={size} variant="outline" onClick={onOpen}>
        {buttonLabel}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="#0e0a1d" color="white" border="1px solid" borderColor="whiteAlpha.300">
          <ModalHeader>Select Existing Media</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Input
              placeholder="Search by filename or folder"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              mb={4}
            />

            {isLoading && <Text color="whiteAlpha.700">Loading media library...</Text>}
            {!!error && <Text color="red.300">{error}</Text>}
            {!isLoading && !error && filteredFiles.length === 0 && (
              <Text color="whiteAlpha.700">No media found for your filter.</Text>
            )}

            <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(5, 1fr)" }} gap={4}>
              {filteredFiles.map((file) => (
                <GridItem
                  key={file.url}
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  borderRadius="md"
                  p={2}
                  bg="whiteAlpha.100"
                >
                  {file.fileName.match(/\.(mp4|webm|mov|m4v)$/i) ? (
                    <Box as="video" src={file.url} controls h="110px" w="100%" borderRadius="md" mb={2} />
                  ) : (
                    <Image src={file.url} alt={file.fileName} h="110px" w="100%" objectFit="cover" borderRadius="md" mb={2} />
                  )}
                  <Box mb={2}>
                    <Text fontSize="xs" noOfLines={1} title={file.fileName}>
                      {file.fileName}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.700" noOfLines={1} title={file.folder}>
                      {file.folder || "(root)"}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    colorScheme="purple"
                    w="100%"
                    onClick={() => {
                      onSelect(file.url);
                      onClose();
                    }}
                  >
                    Use this media
                  </Button>
                </GridItem>
              ))}
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
