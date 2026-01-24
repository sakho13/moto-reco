import type { MenuItem } from "next-admin";

export const adminMenuItems: MenuItem[] = [
  {
    label: "ダッシュボード",
    route: "/",
  },
  {
    label: "ユーザー",
    route: "/users",
  },
  {
    label: "バイク",
    route: "/bikes",
  },
];

export const seedData = {
  users: [
    {
      _id: "user-1",
      name: "山田 太郎",
      email: "taro.yamada@example.com",
      role: "管理者",
    },
    {
      _id: "user-2",
      name: "佐藤 花子",
      email: "hanako.sato@example.com",
      role: "一般",
    },
  ],
  bikes: [
    {
      _id: "bike-1",
      name: "Ninja 400",
      manufacturer: "Kawasaki",
      year: 2022,
    },
    {
      _id: "bike-2",
      name: "CBR250RR",
      manufacturer: "Honda",
      year: 2021,
    },
  ],
};
