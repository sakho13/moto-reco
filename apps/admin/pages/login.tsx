import { SimpleLoginLayout } from "next-admin";

import type { NextPageWithLayout } from "../lib/pageTypes";

const LoginPage: NextPageWithLayout = () => {
  return <SimpleLoginLayout />;
};

LoginPage.getLayout = (page) => page;

export default LoginPage;
