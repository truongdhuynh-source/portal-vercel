import moment from "moment";

export const handleDownloadFile = (res, name) => {
  const file = window.URL.createObjectURL(new Blob([res]));

  const docUrl = document.createElement("a");
  docUrl.href = file;
  docUrl.setAttribute("download", name);
  document.body.appendChild(docUrl);
  docUrl.click();
};

export const formatDate = (date) => {
  return date ? moment(date).format("DD-MM-YYYY") : "--/--";
};

export const formatFullDate = (date) => {
  return date ? moment(date).format("DD-MM-YYYY HH:MM:SS") : "--/--";
};

export const formatUtcFullDate = (date) => {
  return date
    ? moment.utc(date).local().format("DD-MM-YYYY HH:mm:ss")
    : "--/--";
};

export const formatUtcDate = (date) => {
  return date ? moment.utc(date).local().format("DD-MM-YYYY") : "--/--";
};
