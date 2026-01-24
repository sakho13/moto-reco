import type { AppProps } from "next/app";
import { useEffect, useMemo } from "react";
import {
  App,
  AppLayout,
  createLocalStorageAuthProvider,
  LocalStorageDataProvider,
} from "next-admin";

import { adminMenuItems, seedData } from "../lib/adminData";
import type { NextPageWithLayout } from "../lib/pageTypes";

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const AdminApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const dataProvider = useMemo(() => new LocalStorageDataProvider(), []);
  const authProvider = useMemo(() => createLocalStorageAuthProvider(), []);
  const fileProvider = useMemo(
    () => ({
      upload: async (_path: string, file: File) => {
        if (typeof window === "undefined") {
          return "";
        }
        return URL.createObjectURL(file);
      },
    }),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedData = window.localStorage.getItem("data");
    if (storedData) {
      return;
    }

    Object.entries(seedData).forEach(([resource, data]) => {
      dataProvider.setResource(resource, data);
    });
  }, [dataProvider]);

  const getLayout =
    Component.getLayout ??
    ((page) => (
      <AppLayout sidebarMenuItems={adminMenuItems}>{page}</AppLayout>
    ));

  return (
    <App
      dataProvider={dataProvider}
      authProvider={authProvider}
      fileProvider={fileProvider}
      initialTitle="MotoReco Admin"
    >
      {getLayout(<Component {...pageProps} />)}
    </App>
  );
};

export default AdminApp;
