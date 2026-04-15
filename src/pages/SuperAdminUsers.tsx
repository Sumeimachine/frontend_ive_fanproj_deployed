import { useEffect, useState } from "react";
import { Alert, AlertIcon, Box, Button, Heading, Select, Spinner, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { userApi } from "../services/api/userApi";
import type { UserRoleSummary } from "../types/api";

export default function SuperAdminUsers() {
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const saveRole = async (userId: number) => {
    const role = draftRoles[userId] ?? "User";

    try {
      setSavingUserId(userId);
      await userApi.setUserRole(userId, role);
      await loadUsers();
    } catch {
      setError("Role update failed.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg" color="white">Super Admin • Account Roles</Heading>
        <Text color="whiteAlpha.800">Super Admin can promote users to Admin or demote back to User.</Text>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <VStack py={8}>
            <Spinner color="purple.300" />
          </VStack>
        ) : (
          <Box border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" p={4}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th color="whiteAlpha.900">Username</Th>
                  <Th color="whiteAlpha.900">Email</Th>
                  <Th color="whiteAlpha.900">Verified</Th>
                  <Th color="whiteAlpha.900">Role</Th>
                  <Th color="whiteAlpha.900">Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td color="white">{user.username}</Td>
                    <Td color="whiteAlpha.900">{user.email}</Td>
                    <Td color="whiteAlpha.900">{user.isEmailVerified ? "Yes" : "No"}</Td>
                    <Td>
                      <Select
                        size="sm"
                        maxW="140px"
                        bg="#1A1630"
                        color="white"
                        borderColor="whiteAlpha.500"
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
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={() => void saveRole(user.id)}
                        isLoading={savingUserId === user.id}
                      >
                        Save Role
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
