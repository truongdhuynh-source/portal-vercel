import { useEffect } from "react";

export const LicenseRedirect = () => {
  useEffect(() => {
    window.location.href = `${import.meta.env.VITE_APP_LICENSES}/${localStorage.getItem("i18nextLng")}/licenses`;
  }, []);

  return null;
};