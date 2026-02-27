import usersData from "../../data/users.json";

const PAGE_SIZE = 5;

export function fetchSuggestedUsers(cursor = 0) {
  const users = usersData.slice(cursor, cursor + PAGE_SIZE);

  return {
    users,
    nextCursor:
      cursor + PAGE_SIZE < usersData.length
        ? cursor + PAGE_SIZE
        : undefined,
  };
}