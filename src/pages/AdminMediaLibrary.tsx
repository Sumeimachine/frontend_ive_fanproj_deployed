import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Image,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";
import { MAX_MEDIA_UPLOAD_SIZE_BYTES, mediaApi, type MediaLibraryFile } from "../services/api/mediaApi";

type MediaTypeFilter = "all" | "images" | "videos";
type SortMode = "newest" | "oldest" | "largest" | "smallest" | "name";

const videoPattern = /\.(mp4|webm|mov|m4v)$/i;

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

const isVideoFile = (file: MediaLibraryFile) => videoPattern.test(file.fileName);

export default function AdminMediaLibrary() {
  const [files, setFiles] = useState<MediaLibraryFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
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

  const folderStats = useMemo(() => {
    const stats = new Map<string, { count: number; bytes: number }>();

    for (const file of files) {
      const folder = file.folder || "root";
      const current = stats.get(folder) ?? { count: 0, bytes: 0 };
      stats.set(folder, { count: current.count + 1, bytes: current.bytes + file.sizeBytes });
    }

    return [...stats.entries()]
      .map(([folder, stat]) => ({ folder, ...stat }))
      .sort((a, b) => a.folder.localeCompare(b.folder));
  }, [files]);

  const imageCount = useMemo(() => files.filter((file) => !isVideoFile(file)).length, [files]);
  const videoCount = useMemo(() => files.filter(isVideoFile).length, [files]);

  const filteredFiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return files
      .filter((file) => folderFilter === "all" || (file.folder || "root") === folderFilter)
      .filter((file) => {
        if (typeFilter === "images") return !isVideoFile(file);
        if (typeFilter === "videos") return isVideoFile(file);
        return true;
      })
      .filter((file) => {
        if (!normalizedSearch) return true;
        return file.fileName.toLowerCase().includes(normalizedSearch)
          || file.relativePath.toLowerCase().includes(normalizedSearch)
          || file.folder.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (sortMode === "name") return a.fileName.localeCompare(b.fileName);
        if (sortMode === "largest") return b.sizeBytes - a.sizeBytes;
        if (sortMode === "smallest") return a.sizeBytes - b.sizeBytes;
        if (sortMode === "oldest") return new Date(a.updatedAtUtc).getTime() - new Date(b.updatedAtUtc).getTime();
        return new Date(b.updatedAtUtc).getTime() - new Date(a.updatedAtUtc).getTime();
      });
  }, [files, folderFilter, search, sortMode, typeFilter]);

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
      setFolderFilter(uploadFolder || "content");
      await loadLibrary();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: MediaLibraryFile) => {
    if (!window.confirm(`Delete ${file.fileName}? Existing pages using this URL may stop displaying it.`)) {
      return;
    }

    try {
      setBusyUrl(file.url);
      await mediaApi.deleteMediaByUrl(file.url);
      setFiles((prev) => prev.filter((entry) => entry.url !== file.url));
      setTotalFiles((prev) => Math.max(0, prev - 1));
      setTotalBytes((prev) => Math.max(0, prev - file.sizeBytes));
    } catch {
      setError("Delete failed.");
    } finally {
      setBusyUrl(null);
    }
  };

  const handleRename = async (file: MediaLibraryFile) => {
    const nextName = (newNameDraft[file.url] ?? "").trim();
    if (!nextName) {
      setError("Please enter a new file name without extension.");
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

  const resetFilters = () => {
    setSearch("");
    setFolderFilter("all");
    setTypeFilter("all");
    setSortMode("newest");
  };

  return (
    <Box p={{ base: 4, md: 8 }} color="white" minH="100vh" bg="linear-gradient(135deg, #080612, #151126 58%, #26143b)">
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
              Admin media
            </Text>
            <Heading size="lg" mt={1}>Media Library</Heading>
          </Box>
          <Button colorScheme="purple" onClick={() => void loadLibrary()} isLoading={loading}>
            Refresh Library
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
          <MetricCard label="Files" value={totalFiles.toString()} />
          <MetricCard label="Storage" value={formatBytes(totalBytes)} />
          <MetricCard label="Images" value={imageCount.toString()} />
          <MetricCard label="Videos" value={videoCount.toString()} />
        </SimpleGrid>

        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4} bg="rgba(255,255,255,0.07)">
          <Heading size="sm" mb={3}>Upload Media</Heading>
          <Grid templateColumns={{ base: "1fr", md: "220px 1fr auto" }} gap={3} alignItems="end">
            <FormControl>
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
            <Text color={uploading ? "purple.200" : "whiteAlpha.700"} fontSize="sm" pb={{ md: 2 }}>
              {uploading ? "Uploading..." : "1 GB max"}
            </Text>
          </Grid>
        </Box>

        <Grid templateColumns={{ base: "1fr", xl: "260px 1fr" }} gap={5} alignItems="start">
          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={4}>
            <Heading size="sm" mb={3}>Folders</Heading>
            <VStack align="stretch" spacing={2}>
              <Button
                size="sm"
                justifyContent="space-between"
                colorScheme={folderFilter === "all" ? "purple" : undefined}
                variant={folderFilter === "all" ? "solid" : "ghost"}
                color={folderFilter === "all" ? "white" : "whiteAlpha.900"}
                onClick={() => setFolderFilter("all")}
              >
                All folders
                <Badge>{files.length}</Badge>
              </Button>
              {folderStats.map((folder) => (
                <Button
                  key={folder.folder}
                  size="sm"
                  justifyContent="space-between"
                  colorScheme={folderFilter === folder.folder ? "purple" : undefined}
                  variant={folderFilter === folder.folder ? "solid" : "ghost"}
                  color={folderFilter === folder.folder ? "white" : "whiteAlpha.900"}
                  onClick={() => setFolderFilter(folder.folder)}
                >
                  <Text noOfLines={1}>{folder.folder}</Text>
                  <Badge>{folder.count}</Badge>
                </Button>
              ))}
            </VStack>
          </Box>

          <VStack align="stretch" spacing={4}>
            <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={4}>
              <Grid templateColumns={{ base: "1fr", md: "1fr 160px 170px auto" }} gap={3} alignItems="end">
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Search</FormLabel>
                  <Input
                    placeholder="Filename, folder, or path"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    color="white"
                    bg="#151126"
                    borderColor="whiteAlpha.400"
                    _placeholder={{ color: "whiteAlpha.600" }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Type</FormLabel>
                  <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MediaTypeFilter)} bg="#151126" color="white" borderColor="whiteAlpha.400">
                    <option value="all">All</option>
                    <option value="images">Images</option>
                    <option value="videos">Videos</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel color="whiteAlpha.900">Sort</FormLabel>
                  <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} bg="#151126" color="white" borderColor="whiteAlpha.400">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="largest">Largest</option>
                    <option value="smallest">Smallest</option>
                    <option value="name">Name</option>
                  </Select>
                </FormControl>
                <Button variant="outline" colorScheme="pink" onClick={resetFilters}>
                  Reset
                </Button>
              </Grid>
            </Box>

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
                No uploaded media found for the current filters.
              </Alert>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, "2xl": 3 }} spacing={4}>
              {filteredFiles.map((file) => (
                <MediaCard
                  key={file.url}
                  file={file}
                  busyUrl={busyUrl}
                  renamingUrl={renamingUrl}
                  newName={newNameDraft[file.url] ?? ""}
                  onStartRename={() => {
                    setRenamingUrl(file.url);
                    setNewNameDraft((prev) => ({ ...prev, [file.url]: file.fileName.replace(/\.[^/.]+$/, "") }));
                  }}
                  onRenameNameChange={(value) => setNewNameDraft((prev) => ({ ...prev, [file.url]: value }))}
                  onRename={() => void handleRename(file)}
                  onCancelRename={() => setRenamingUrl(null)}
                  onDelete={() => void handleDelete(file)}
                />
              ))}
            </SimpleGrid>
          </VStack>
        </Grid>
      </VStack>
    </Box>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Stat border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" p={4}>
      <StatLabel color="whiteAlpha.700">{label}</StatLabel>
      <StatNumber color="white" fontSize="2xl">{value}</StatNumber>
    </Stat>
  );
}

function MediaCard({
  file,
  busyUrl,
  renamingUrl,
  newName,
  onStartRename,
  onRenameNameChange,
  onRename,
  onCancelRename,
  onDelete,
}: {
  file: MediaLibraryFile;
  busyUrl: string | null;
  renamingUrl: string | null;
  newName: string;
  onStartRename: () => void;
  onRenameNameChange: (value: string) => void;
  onRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}) {
  const isVideo = isVideoFile(file);

  return (
    <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(255,255,255,0.07)" overflow="hidden">
      <Box bg="#0c0818" h="190px">
        {isVideo ? (
          <Box as="video" src={file.url} controls h="100%" w="100%" objectFit="cover" />
        ) : (
          <Image src={file.url} alt={file.fileName} h="100%" w="100%" objectFit="cover" />
        )}
      </Box>

      <VStack align="stretch" spacing={3} p={4}>
        <HStack justify="space-between" align="start">
          <Box minW={0}>
            <Text color="white" fontWeight="bold" noOfLines={1} title={file.fileName}>
              {file.fileName}
            </Text>
            <Text color="whiteAlpha.700" fontSize="xs" noOfLines={1} title={file.relativePath}>
              {file.relativePath}
            </Text>
          </Box>
          <Badge colorScheme={isVideo ? "pink" : "purple"}>{isVideo ? "Video" : "Image"}</Badge>
        </HStack>

        <HStack color="whiteAlpha.750" fontSize="xs" justify="space-between">
          <Text>{file.folder || "root"}</Text>
          <Text>{formatBytes(file.sizeBytes)}</Text>
        </HStack>
        <Text color="whiteAlpha.600" fontSize="xs">
          {new Date(file.updatedAtUtc).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
        </Text>

        <HStack flexWrap="wrap">
          <Button size="sm" variant="outline" colorScheme="cyan" as="a" href={file.url} target="_blank" rel="noreferrer noopener">
            Open
          </Button>
          <Button size="sm" colorScheme="yellow" onClick={onStartRename}>
            Rename
          </Button>
          <Button size="sm" colorScheme="red" onClick={onDelete} isLoading={busyUrl === file.url}>
            Delete
          </Button>
        </HStack>

        {renamingUrl === file.url && (
          <HStack>
            <Input
              size="sm"
              value={newName}
              onChange={(event) => onRenameNameChange(event.target.value)}
              placeholder="New filename"
              color="white"
              bg="#151126"
              borderColor="whiteAlpha.400"
            />
            <Button size="sm" colorScheme="purple" onClick={onRename} isLoading={busyUrl === file.url}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelRename}>
              Cancel
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}
