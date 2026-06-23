import { useEffect, useMemo, useState } from "react";
import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, Heading, HStack, Image, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import { MAX_MEDIA_UPLOAD_SIZE_BYTES, mediaApi, type MediaLibraryFile } from "../services/api/mediaApi";

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
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("content");

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

  const usageText = useMemo(() => `Total files: ${totalFiles} | Space used: ${formatBytes(totalBytes)}`, [totalBytes, totalFiles]);
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
    if (!window.confirm("Delete this media file? Existing pages using this URL may stop displaying it.")) {
      return;
    }

    try {
      setBusyUrl(url);
      await mediaApi.deleteMediaByUrl(url);
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
      const renamed = await mediaApi.renameMedia(file.url, nextName);
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

  const handleUpload = async (file?: File) => {
    if (!file) return;

    if (file.size > MAX_MEDIA_UPLOAD_SIZE_BYTES) {
      setError("File is over the 1 GB upload limit.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await mediaApi.uploadMedia(file, uploadFolder || "content");
      await loadLibrary();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
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
        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4} bg="rgba(255,255,255,0.06)">
          <Heading size="sm" color="white" mb={3}>Upload Media</Heading>
          <HStack align={{ base: "stretch", md: "end" }} flexDirection={{ base: "column", md: "row" }} spacing={3}>
            <FormControl maxW={{ md: "220px" }}>
              <FormLabel color="whiteAlpha.900">Folder</FormLabel>
              <Input
                value={uploadFolder}
                onChange={(event) => setUploadFolder(event.target.value)}
                placeholder="content"
                color="white"
                bg="#151126"
                borderColor="whiteAlpha.400"
              />
            </FormControl>
            <FormControl>
              <FormLabel color="whiteAlpha.900">Image or Video</FormLabel>
              <Input
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                color="white"
                onChange={(event) => {
                  void handleUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </FormControl>
            <Text color={uploading ? "purple.200" : "whiteAlpha.700"} fontSize="sm" minW="88px">
              {uploading ? "Uploading..." : "1 GB max"}
            </Text>
          </HStack>
        </Box>
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
            No uploaded media found for your current search.
          </Alert>
        )}

        <VStack align="stretch" spacing={4}>
          {filteredFiles.map((file) => (
            <Box key={file.url} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
              <HStack align="start" spacing={4} flexWrap="wrap">
                {file.fileName.match(/\.(mp4|webm|mov|m4v)$/i) ? (
                  <Box as="video" src={file.url} controls maxW="180px" borderRadius="md" />
                ) : (
                  <Image src={file.url} alt={file.fileName} maxW="180px" borderRadius="md" objectFit="cover" />
                )}
                <VStack align="start" spacing={1}>
                  <Text color="white" fontWeight="bold">{file.fileName}</Text>
                  <Text color="purple.200" fontSize="sm">Folder: {file.folder || "root"}</Text>
                  <Text color="whiteAlpha.800" fontSize="sm">{file.relativePath}</Text>
                  <Text color="whiteAlpha.700" fontSize="sm">Size: {formatBytes(file.sizeBytes)}</Text>
                  <Text color="whiteAlpha.700" fontSize="sm">Updated: {new Date(file.updatedAtUtc).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</Text>
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
                      Open Media
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
