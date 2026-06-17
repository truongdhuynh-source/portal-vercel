import App from "@/App";
import { AppContextProvider } from "@/AppContext";
import AntdProvider from "@/providers/AntdProvider";
import { BrowserRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";
const AppProviders = () => {
  return (
    <AppContextProvider>
      <AntdProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ReduxProvider store={store}>
            <App />
          </ReduxProvider>
        </BrowserRouter>
      </AntdProvider>
    </AppContextProvider>
  );
};

export default AppProviders;
