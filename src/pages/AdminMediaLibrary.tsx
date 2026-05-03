import { useEffect, useMemo, useState } from "react";
import { Alert, AlertIcon, Box, Button, Heading, HStack, Image, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { mediaApi, type MediaLibraryFile } from "../services/api/mediaApi";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export default function AdminMediaLibrary() {
  const [files, setFiles] = useState<MediaLibraryFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [renamingUrl, setRenamingUrl] = useState<string | null>(null);
  const [newNameDraft, setNewNameDraft] = useState<Record<string, string>>({});
  const [busyUrl, setBusyUrl] = useState<string | null>(null);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const library = await mediaApi.getLibrary();
      setFiles(library.files);
      setTotalFiles(library.totalFiles);
      setTotalBytes(library.totalBytes);
    } catch {
      setError("Unable to load media library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  const usageText = useMemo(() => `Total files: ${totalFiles} • Space used: ${formatBytes(totalBytes)}`, [totalBytes, totalFiles]);
  const filteredFiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return files;
    }

    return files.filter((file) =>
      file.fileName.toLowerCase().includes(normalizedSearch)
      || file.relativePath.toLowerCase().includes(normalizedSearch)
      || file.folder.toLowerCase().includes(normalizedSearch),
    );
  }, [files, search]);

  const handleDelete = async (url: string) => {
    try {
      setBusyUrl(url);
      await mediaApi.deleteImageByUrl(url);
      setFiles((prev) => prev.filter((file) => file.url !== url));
      setTotalFiles((prev) => Math.max(0, prev - 1));
      const deleted = files.find((file) => file.url === url);
      if (deleted) {
        setTotalBytes((prev) => Math.max(0, prev - deleted.sizeBytes));
      }
    } catch {
      setError("Delete failed.");
    } finally {
      setBusyUrl(null);
    }
  };

  const handleRename = async (file: MediaLibraryFile) => {
    const nextName = (newNameDraft[file.url] ?? "").trim();
    if (!nextName) {
      setError("Please enter a new file name (without extension).");
      return;
    }

    try {
      setBusyUrl(file.url);
      const renamed = await mediaApi.renameImage(file.url, nextName);
      setFiles((prev) =>
        prev.map((entry) =>
          entry.url === file.url
            ? {
                ...entry,
                url: renamed.url,
                relativePath: renamed.relativePath,
                fileName: renamed.fileName,
              }
            : entry,
        ),
      );
      setRenamingUrl(null);
      setNewNameDraft((prev) => ({ ...prev, [file.url]: "" }));
    } catch {
      setError("Rename failed. Ensure filename is unique in the folder.");
    } finally {
      setBusyUrl(null);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={5}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Heading size="lg" color="white">Media Library</Heading>
          <Button colorScheme="purple" onClick={() => void loadLibrary()} isLoading={loading}>
            Check Space / Refresh
          </Button>
        </HStack>

        <Text color="whiteAlpha.800">{usageText}</Text>
        <Input
          placeholder="Search by file name or folder..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          color="white"
          _placeholder={{ color: "whiteAlpha.600" }}
        />

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading && (
          <VStack py={8}>
            <Spinner color="purple.300" />
          </VStack>
        )}

        {!loading && filteredFiles.length === 0 && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            No uploaded images found for your current search.
          </Alert>
        )}

        <VStack align="stretch" spacing={4}>
          {filteredFiles.map((file) => (
            <Box key={file.url} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
              <HStack align="start" spacing={4} flexWrap="wrap">
                <Image src={file.url} alt={file.fileName} maxW="180px" borderRadius="md" objectFit="cover" />
                <VStack align="start" spacing={1}>
                  <Text color="white" fontWeight="bold">{file.fileName}</Text>
                  <Text color="purple.200" fontSize="sm">Folder: {file.folder || "root"}</Text>
                  <Text color="whiteAlpha.800" fontSize="sm">{file.relativePath}</Text>
                  <Text color="whiteAlpha.700" fontSize="sm">Size: {formatBytes(file.sizeBytes)}</Text>
                  <Text color="whiteAlpha.700" fontSize="sm">Updated: {new Date(file.updatedAtUtc).toLocaleString()}</Text>
                  <HStack flexWrap="wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="cyan"
                      as="a"
                      href={file.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Open Image
                    </Button>
                      <Button
                        size="sm"
                        variant="solid"
                        colorScheme="yellow"
                        onClick={() => {
                          setRenamingUrl(file.url);
                        setNewNameDraft((prev) => ({ ...prev, [file.url]: file.fileName.replace(/\.[^/.]+$/, "") }));
                      }}
                    >
                      Rename
                    </Button>
                      <Button
                        size="sm"
                        variant="solid"
                        colorScheme="red"
                        onClick={() => void handleDelete(file.url)}
                        isLoading={busyUrl === file.url}
                    >
                      Delete
                    </Button>
                  </HStack>
                  {renamingUrl === file.url && (
                    <HStack>
                      <Input
                        size="sm"
                        value={newNameDraft[file.url] ?? ""}
                        onChange={(event) =>
                          setNewNameDraft((prev) => ({ ...prev, [file.url]: event.target.value }))
                        }
                        placeholder="New file name (no extension)"
                      />
                      <Button size="sm" colorScheme="purple" onClick={() => void handleRename(file)} isLoading={busyUrl === file.url}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenamingUrl(null)}>
                        Cancel
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}
