import { Edit, Number as NumberField, Text } from "next-admin";
import type { IEntity } from "next-admin";

type Bike = IEntity & {
  name: string;
  manufacturer: string;
  year: number;
};

const BikesEditPage = () => {
  return (
    <Edit<Bike> resource="bikes" hasRemove>
      <Text label="モデル" source="name" />
      <Text label="メーカー" source="manufacturer" />
      <NumberField label="年式" source="year" />
    </Edit>
  );
};

export default BikesEditPage;
