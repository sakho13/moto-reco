import { Create, Number as NumberField, Text } from "next-admin";
import type { IEntity } from "next-admin";

type Bike = IEntity & {
  name: string;
  manufacturer: string;
  year: number;
};

const BikesCreatePage = () => {
  return (
    <Create<Bike> resource="bikes">
      <Text label="モデル" source="name" />
      <Text label="メーカー" source="manufacturer" />
      <NumberField label="年式" source="year" />
    </Create>
  );
};

export default BikesCreatePage;
