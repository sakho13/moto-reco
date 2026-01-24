import { List, Text } from "next-admin";
import type { IEntity } from "next-admin";

type User = IEntity & {
  name: string;
  email: string;
  role: string;
};

const UsersListPage = () => {
  return (
    <List<User> resource="users" hasCreate hasEdit hasShow>
      <Text label="ID" source="_id" />
      <Text label="氏名" source="name" />
      <Text label="メール" source="email" />
      <Text label="権限" source="role" />
    </List>
  );
};

export default UsersListPage;
