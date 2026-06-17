import JA from "@/assets/images/ja.png";
import EN from "@/assets/images/en.png";
import VI from "@/assets/images/vi.png";
import dgnIcon from "@/assets/file-icons/dgn.png";
import dwgIcon from "@/assets/file-icons/dwg.png";
import dxfIcon from "@/assets/file-icons/dxf.png";
import stepIcon from "@/assets/file-icons/step.svg";
import stpIcon from "@/assets/file-icons/stp.svg";
import ifcIcon from "@/assets/file-icons/ifc.svg";
import rvtIcon from "@/assets/file-icons/rvt.svg";
import rfaIcon from "@/assets/file-icons/rfa.svg";
import objIcon from "@/assets/file-icons/obj.svg";
import stlIcon from "@/assets/file-icons/stl.png";
import nwcIcon from "@/assets/file-icons/nwc.svg";
import rcsIcon from "@/assets/file-icons/rcs.png";
import vsfxIcon from "@/assets/file-icons/vsfx.png";
import usdzIcon from "@/assets/file-icons/usdz.png";
import dwfIcon from "@/assets/file-icons/dwf.svg";
import dwtIcon from "@/assets/file-icons/dwt.png";
import {
  BoxIcon,
  DropBoxIcon,
  GoogleDriveIcon,
  OneDriveIcon,
  SharePointIcon,
  WebDAVIcon,
} from "@/assets/icons";

const ACCESS_TOKEN_KEY = "actp";
const REFRESH_TOKEN_KEY = "refp";
const ERROR_CODE_UNPROCESSABLE_ENTITY = 422;
const ERROR_CODE_UNAUTHORIZED = 401;
const ERROR_CODE_BAD_REQUEST = 400;
const USER_VINA = "user_vina";
const USER_ODA = "user";
const FREE_STORAGE_LIMIT = 2147483648; //2GB
const FILE_UPLOAD_LIMIT = 209715200; //200MB
const AUTH_USERS = "auth_users";
const LOGOUT_SYNC_KEY = "asLgt";
const PENDING_LOGOUT_KEY = "asPnd";
const AUTODESK_VIEWER = "autodesk_viewer";
const VINA_CAD_ACCEPT_FILE_DEFAULT = [".DGN", ".DWF", ".DWG", ".DXF"];
const VINA_BIM_ACCEPT_FILE_DEFAULT = [".RVT", ".RFA", ".RTE"];
const ERROR_CODE_STORAGE_UNAUTHORIZED_LIST = [
  "BOX_UNAUTHORIZED",
  "STORAGE_UNAUTHORIZED",
  "STORAGE_NOT_CONNECTED",
  "GG_UNAUTHORIZED",
  "ONE_DRIVE_UNAUTHORIZED",
  "SHARE_POINT_UNAUTHORIZED",
  "DROPBOX_UNAUTHORIZED",
  "WEBDAV_UNAUTHORIZED",
  "OCIS_UNAUTHORIZED",
];

const CURRENT_TAB = "current_tab";
const CURRENT_PAGE = "current_page";
const VINA_CAD = "VinaCAD";
const VINA_CAD_WEB = "VinaCAD Web";
const USER_ID = "userId";
const VINA_CAD_APP = "vinacad";
const VINA_BIM_APP = "vinabim";

const TRIAL = "TRIAL";
const ACTIVE = "ACTIVE";
const MONTHS_3 = "MONTHS_3";
const MONTHS_6 = "MONTHS_6";
const YEAR_1 = "YEAR_1";
const YEARS_2 = "YEARS_2";
const accountColorList = [
  "#ff69b4", // Hot pink
  "#ffd700", // Gold
  "#26c28c", // Sea green
  "#1abc9c", // Turquoise
  "#9b59b6", // Amethyst
  "#e74c3c", // Crimson
  "#3498db", // Bright blue
  "#f1c40f", // Sunny yellow
  "#7f8c8d", // Taupe
  "#dc3545", // Red
];

const DEFAULT_PAGE_LIMIT = 20;

const GET_SCREEN_SIZE = () => {
  const width = window.innerWidth;

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLargeDesktop: width >= 1440,
  };
};

const LANGUAGE_MAP = {
  vi: { image: VI, name: "Việt Nam", code: "vi" },
  en: { image: EN, name: "English", code: "en" },
  ja: { image: JA, name: "日本語", code: "ja" },
};

const STORAGE_PROVIDER_META = {
  gg_drive: {
    rootId: "0",
    title: "Google Drive",
    icon: <GoogleDriveIcon width={24} height={24} />,
  },
  box: {
    rootId: "0",
    title: "Box",
    icon: <BoxIcon width={24} height={24} />,
    isTranslateY: true,
  },
  dropbox: {
    rootId: "0",
    title: "Dropbox",
    icon: <DropBoxIcon width={20} height={20} />,
  },
  one_drive: {
    rootId: "0",
    title: "OneDrive",
    icon: <OneDriveIcon width={24} height={24} />,
  },
  share_point: {
    rootId: "0",
    title: "SharePoint",
    icon: <SharePointIcon width={24} height={24} />,
  },
  web_dav: {
    rootId: "0",
    title: "WebDAV",
    icon: <WebDAVIcon width={24} height={24} />,
  },
  ocis: {
    rootId: "0",
    title: "OCIS",
    icon: <WebDAVIcon width={24} height={24} />,
  },
};

const DOWNLOAD_STATUS_META = {
  downloading: {
    status: "downloading",
    color: "#1677ff",
  },
  done: {
    status: "done",
    color: "#52c41a",
  },
  error: {
    status: "failed",
    color: "#ff4d4f",
  },
};

const RECYCLE_BIN_PROVIDERS_NOT_SUPPORTED = {
  one_drive: "OneDrive",
  share_point: "SharePoint",
};

const FILE_TYPE_ICON_MAP = {
  dgn: dgnIcon,
  dwf: dwfIcon,
  dwg: dwgIcon,
  dwt: dwtIcon,
  dxf: dxfIcon,
  step: stepIcon,
  stp: stpIcon,
  stl: stlIcon,
  ifc: ifcIcon,
  ifczip: ifcIcon,
  nwc: nwcIcon,
  nwd: nwcIcon,
  obj: objIcon,
  rcs: rcsIcon,
  rfa: rfaIcon,
  rvt: rvtIcon,
  vsfx: vsfxIcon,
  usdz: usdzIcon,
};

const FILE_TYPE_CHECK = ["folder", "site", "drive"];
const DRAWING_EXTENSIONS = "dwg,dxf,dwt,dgn,ifc,rvt,rfa,rte,nwd,nwc,skp,3dm,pln,pla,step,stp,iges,igs,sat,sab,stl,obj,fbx,pdf";

export {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  ERROR_CODE_UNPROCESSABLE_ENTITY,
  ERROR_CODE_UNAUTHORIZED,
  ERROR_CODE_BAD_REQUEST,
  USER_VINA,
  USER_ODA,
  VINA_CAD_ACCEPT_FILE_DEFAULT,
  VINA_BIM_ACCEPT_FILE_DEFAULT,
  FREE_STORAGE_LIMIT,
  TRIAL,
  ACTIVE,
  YEAR_1,
  YEARS_2,
  MONTHS_3,
  MONTHS_6,
  AUTH_USERS,
  LOGOUT_SYNC_KEY,
  PENDING_LOGOUT_KEY,
  AUTODESK_VIEWER,
  accountColorList,
  FILE_UPLOAD_LIMIT,
  CURRENT_PAGE,
  VINA_CAD,
  VINA_CAD_WEB,
  USER_ID,
  VINA_CAD_APP,
  VINA_BIM_APP,
  CURRENT_TAB,
  DEFAULT_PAGE_LIMIT,
  GET_SCREEN_SIZE,
  LANGUAGE_MAP,
  STORAGE_PROVIDER_META,
  DOWNLOAD_STATUS_META,
  RECYCLE_BIN_PROVIDERS_NOT_SUPPORTED,
  FILE_TYPE_ICON_MAP,
  FILE_TYPE_CHECK,
  ERROR_CODE_STORAGE_UNAUTHORIZED_LIST,
  DRAWING_EXTENSIONS
};
