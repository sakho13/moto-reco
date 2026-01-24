import { List, Number as NumberField, Text } from "next-admin";
import type { IEntity } from "next-admin";

type Bike = IEntity & {
  name: string;
  manufacturer: string;
  year: number;
};

const BikesListPage = () => {
  return (
    <List<Bike> resource="bikes" hasCreate hasEdit hasShow>
      <Text label="ID" source="_id" />
      <Text label="モデル" source="name" />
      <Text label="メーカー" source="manufacturer" />
      <NumberField label="年式" source="year" />
    </List>
  );
};

export default BikesListPage;
