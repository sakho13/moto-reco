import { Create, Text } from "next-admin";
import type { IEntity } from "next-admin";

type User = IEntity & {
  name: string;
  email: string;
  role: string;
};

const UsersCreatePage = () => {
  return (
    <Create<User> resource="users">
      <Text label="氏名" source="name" />
      <Text label="メール" source="email" />
      <Text label="権限" source="role" />
    </Create>
  );
};

export default UsersCreatePage;
