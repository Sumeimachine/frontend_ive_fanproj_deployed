import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { userApi } from "../services/api/userApi";
import type { UserRoleSummary } from "../types/api";

type UserOperation = "role" | "unlock" | "verify" | "sessions";

const selectStyles = {
  bg: "#171326",
  color: "white",
  borderColor: "whiteAlpha.500",
  _hover: { borderColor: "purple.300" },
  _focusVisible: {
    borderColor: "purple.300",
    boxShadow: "0 0 0 1px rgba(196, 146, 255, 0.75)",
  },
  sx: {
    option: {
      bg: "#171326",
      color: "white",
    },
  },
};

function isLocked(user: UserRoleSummary) {
  return !!user.lockoutEnd && new Date(user.lockoutEnd).getTime() > Date.now();
}

function formatLockout(user: UserRoleSummary) {
  if (!isLocked(user) || !user.lockoutEnd) return "Clear";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(user.lockoutEnd));
}

function metricLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export default function SuperAdminUsers() {
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<{ userId: number; type: UserOperation } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRoleSummary[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<number, "User" | "Admin">>({});

  const loadUsers = async () => {
    try {
      const data = await userApi.listUsersForRoleManagement();
      setUsers(data);
      setDraftRoles(
        data.reduce<Record<number, "User" | "Admin">>((acc, user) => {
          acc[user.id] = user.role === "Admin" ? "Admin" : "User";
          return acc;
        }, {}),
      );
      setError(null);
    } catch {
      setError("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [user.username, user.email, user.role]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, users]);

  const lockedCount = useMemo(() => users.filter(isLocked).length, [users]);
  const unverifiedCount = useMemo(() => users.filter((user) => !user.isEmailVerified).length, [users]);
  const adminCount = useMemo(() => users.filter((user) => user.role === "Admin" || user.role === "Super-Admin").length, [users]);

  const runOperation = async (user: UserRoleSummary, type: UserOperation) => {
    try {
      setOperation({ userId: user.id, type });
      setError(null);
      setSuccess(null);

      if (type === "role") {
        await userApi.setUserRole(user.id, draftRoles[user.id] ?? "User");
        setSuccess(`Updated ${user.username}'s role.`);
      }

      if (type === "unlock") {
        await userApi.unlockAccount(user.id);
        setSuccess(`Unlocked ${user.username}'s account.`);
      }

      if (type === "verify") {
        await userApi.verifyEmail(user.id);
        setSuccess(`Marked ${user.username}'s email as verified.`);
      }

      if (type === "sessions") {
        if (!window.confirm(`Revoke stored sessions for ${user.username}? They may need to sign in again.`)) {
          return;
        }

        await userApi.revokeSessions(user.id);
        setSuccess(`Revoked stored sessions for ${user.username}.`);
      }

      await loadUsers();
    } catch {
      setError("Super Admin operation failed.");
    } finally {
      setOperation(null);
    }
  };

  const isBusy = (userId: number, type: UserOperation) => operation?.userId === userId && operation.type === type;

  return (
    <Box p={{ base: 4, md: 8 }} bg="linear-gradient(135deg, #080612 0%, #171326 48%, #241336 100%)" minH="100vh">
      <VStack align="stretch" spacing={6}>
        <Box borderBottom="1px solid" borderColor="whiteAlpha.300" pb={5}>
          <Text color="pink.200" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
            Super Admin
          </Text>
          <Heading size="lg" color="white" mt={2}>
            Account Command Center
          </Heading>
          <Text color="whiteAlpha.800" maxW="760px" mt={2}>
            Manage roles, release account lockouts, verify trusted accounts, and revoke stale sessions from one controlled page.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <MetricCard label="Accounts" value={users.length.toString()} detail="registered users" />
          <MetricCard label="Staff Roles" value={adminCount.toString()} detail="admin capable" />
          <MetricCard label="Locked" value={lockedCount.toString()} detail={metricLabel(lockedCount, "account", "accounts")} tone={lockedCount > 0 ? "warning" : "normal"} />
          <MetricCard label="Unverified" value={unverifiedCount.toString()} detail={metricLabel(unverifiedCount, "email", "emails")} tone={unverifiedCount > 0 ? "warning" : "normal"} />
        </SimpleGrid>

        {error && (
          <Alert status="error" borderRadius="md" bg="rgba(130, 28, 64, 0.35)" color="white">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {success && (
          <Alert status="success" borderRadius="md" bg="rgba(32, 112, 82, 0.35)" color="white">
            <AlertIcon />
            {success}
          </Alert>
        )}

        <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="rgba(9, 8, 20, 0.78)" p={{ base: 3, md: 5 }}>
          <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }} mb={4}>
            <Box>
              <Heading size="md" color="white">
                Account Operations
              </Heading>
              <Text color="whiteAlpha.700" fontSize="sm">
                Search by username, email, or role.
              </Text>
            </Box>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search accounts"
              maxW={{ md: "320px" }}
              bg="#151126"
              color="white"
              borderColor="whiteAlpha.400"
              _placeholder={{ color: "whiteAlpha.500" }}
              _focusVisible={{ borderColor: "pink.300", boxShadow: "0 0 0 1px rgba(255, 136, 197, 0.8)" }}
            />
          </HStack>

          {loading ? (
            <VStack py={10}>
              <Spinner color="purple.300" />
            </VStack>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th color="whiteAlpha.900">Account</Th>
                    <Th color="whiteAlpha.900">Status</Th>
                    <Th color="whiteAlpha.900">Role</Th>
                    <Th color="whiteAlpha.900" isNumeric>Points</Th>
                    <Th color="whiteAlpha.900">Recovery</Th>
                    <Th color="whiteAlpha.900">Sessions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((user) => (
                    <Tr key={user.id}>
                      <Td color="white">
                        <Text fontWeight="semibold">{user.username}</Text>
                        <Text color="whiteAlpha.700" fontSize="xs">{user.email}</Text>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={1}>
                          <Badge colorScheme={user.isEmailVerified ? "green" : "yellow"}>
                            {user.isEmailVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge colorScheme={isLocked(user) ? "red" : "purple"}>
                            {isLocked(user) ? "Locked" : "Unlocked"}
                          </Badge>
                          <Text color="whiteAlpha.700" fontSize="xs">
                            Failed: {user.failedLoginAttempts} | Lockout: {formatLockout(user)}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <HStack align="center">
                          <Select
                            size="sm"
                            width="128px"
                            {...selectStyles}
                            value={draftRoles[user.id] ?? (user.role === "Admin" ? "Admin" : "User")}
                            onChange={(event) =>
                              setDraftRoles((previous) => ({
                                ...previous,
                                [user.id]: event.target.value === "Admin" ? "Admin" : "User",
                              }))
                            }
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </Select>
                          <Button
                            size="sm"
                            colorScheme="purple"
                            onClick={() => void runOperation(user, "role")}
                            isLoading={isBusy(user.id, "role")}
                          >
                            Save
                          </Button>
                        </HStack>
                      </Td>
                      <Td color="white" isNumeric>{user.currencyBalance}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="pink"
                            onClick={() => void runOperation(user, "unlock")}
                            isDisabled={!isLocked(user) && user.failedLoginAttempts === 0}
                            isLoading={isBusy(user.id, "unlock")}
                          >
                            Unlock
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            onClick={() => void runOperation(user, "verify")}
                            isDisabled={user.isEmailVerified}
                            isLoading={isBusy(user.id, "verify")}
                          >
                            Verify
                          </Button>
                        </HStack>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={2}>
                          <Text color="whiteAlpha.800" fontSize="xs">
                            {user.activeRefreshSessions} active
                          </Text>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="orange"
                            onClick={() => void runOperation(user, "sessions")}
                            isDisabled={user.activeRefreshSessions === 0}
                            isLoading={isBusy(user.id, "sessions")}
                          >
                            Revoke
                          </Button>
                        </VStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "normal",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "normal" | "warning";
}) {
  return (
    <Box
      border="1px solid"
      borderColor={tone === "warning" ? "pink.300" : "whiteAlpha.300"}
      borderRadius="lg"
      bg={tone === "warning" ? "rgba(255, 92, 164, 0.16)" : "rgba(255,255,255,0.07)"}
      p={4}
      boxShadow={tone === "warning" ? "0 0 22px rgba(255, 92, 164, 0.18)" : "none"}
    >
      <Text color="whiteAlpha.700" fontSize="xs" textTransform="uppercase" letterSpacing="0.12em">
        {label}
      </Text>
      <Text color="white" fontSize="3xl" fontWeight="bold" lineHeight="1.1" mt={2}>
        {value}
      </Text>
      <Text color="whiteAlpha.700" fontSize="sm" mt={1}>
        {detail}
      </Text>
    </Box>
  );
}
