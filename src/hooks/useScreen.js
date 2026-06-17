import { GET_SCREEN_SIZE } from "@/constants";
import { setScreen } from "@/redux/features/app/appSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useScreen() {
  const dispatch = useDispatch();
  const screen = useSelector((state) => state.app.screen);

  useEffect(() => {
    let timeoutId = null;

    const handleResize = () => {
      dispatch(setScreen(GET_SCREEN_SIZE()));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screen;
}
