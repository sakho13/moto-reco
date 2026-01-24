import { Edit, Text } from "next-admin";
import type { IEntity } from "next-admin";

type User = IEntity & {
  name: string;
  email: string;
  role: string;
};

const UsersEditPage = () => {
  return (
    <Edit<User> resource="users" hasRemove>
      <Text label="氏名" source="name" />
      <Text label="メール" source="email" />
      <Text label="権限" source="role" />
    </Edit>
  );
};

export default UsersEditPage;
