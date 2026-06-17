import { useEffect } from "react";

export const ProfileRedirect = () => {
  useEffect(() => {
    window.location.href = `${import.meta.env.VITE_APP_PROFILE}/${localStorage.getItem("i18nextLng")}/profile`;
  }, []);

  return null;
};