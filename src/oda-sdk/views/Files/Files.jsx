import React from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import moment from "moment";
import bytes from "bytes";
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import picomatch from "picomatch-browser";
import { File as OdaFile, normalizeParam } from "@inweb/client";
import "./Files.css";
import Cookies from "js-cookie";
import {
  Tooltip,
  Button,
  ConfigProvider,
  Dropdown,
  Empty,
  Modal,
  notification,
  Table,
  Typography,
  Input,
  Select,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  DesktopOutlined,
  MoreOutlined,
  UploadOutlined,
  CheckCircleTwoTone,
  ShareAltOutlined,
  StopOutlined,
  PlusOutlined,
  LoadingOutlined,
  DeploymentUnitOutlined,
} from "@ant-design/icons";
import i18next from "i18next";
import { StatusTag } from "@/components";
import ClientFactory from "../../ClientFactory";
import FileUploadModal from "./FileUploadModal";
import CreateAssemblyModal from "../Assemblies/CreateAssemblyModal";
import FileVersionsModal from "./FileVersionsModal";
import {
  VINA_CAD_ACCEPT_FILE_DEFAULT,
  CURRENT_PAGE,
  VINA_BIM_ACCEPT_FILE_DEFAULT,
  VINA_BIM_APP,
  VINA_CAD_APP,
  USER_ODA,
  USER_VINA,
  FILE_TYPE_ICON_MAP,
  REFRESH_TOKEN_KEY,
} from "@/constants";
import ShareModal from "../Share/ShareModal";
import logo from "@/assets/images/logo-vinacad.png";
import logoBim from "@/assets/images/logo-vinabim.png";
import { withTranslation } from "react-i18next";
import axiosInstance from "@/plugins/axios";
import StorageUsage from "@/components/StorageUsage/StorageUsage";
import getUserIdLogin from "@/utils/getUserIdLogin";
import PreviewModal from "@/components/PreviewModal";
import { getFileExtension } from "@/utils/getFileExtension";
import { store } from "@/redux/store";
import { createEventToTrackingSession, createTeraTrackingPageMeta } from "@/utils/teraTracking";

const { Text } = Typography;
const t = i18next.t;
const { Search } = Input;

function FileTypeIcon({ fileName, className }) {
  const extension = getFileExtension(fileName);
  const iconSrc = FILE_TYPE_ICON_MAP[extension];
  const extensionLabel = (extension || "file").slice(0, 4).toUpperCase();

  return (
    <div className={classNames(className, "file-type-icon")} aria-hidden="true">
      {iconSrc ? (
        <img
          className="file-type-icon__img"
          src={iconSrc}
          alt={`${extensionLabel} file icon`}
        />
      ) : (
        <svg
          className="file-type-icon__svg"
          viewBox="0 0 22 26"
          role="img"
          aria-label={`${extensionLabel} file icon`}
        >
          <path
            d="M4 1.5h9l5 5v16A2.5 2.5 0 0 1 15.5 25h-11A2.5 2.5 0 0 1 2 22.5V4A2.5 2.5 0 0 1 4.5 1.5Z"
            fill="#E8EEF6"
            stroke="#8EA2B8"
          />
          <path d="M13 1.5v5h5" fill="#D6E1EE" stroke="#8EA2B8" />
          <text
            x="11"
            y="15"
            textAnchor="middle"
            fill="#35506B"
            className="file-type-icon__svg-glyph"
          >
            {extensionLabel}
          </text>
        </svg>
      )}
    </div>
  );
}

function ViewerLink({ className, file, canOpen, children, isTocViewer }) {
  const user_vina_id = getUserIdLogin();
  const lang = localStorage.getItem("i18nextLng");
  const isDWG =
    file?.name?.toLowerCase().includes(".dwg") ||
    file?.name?.toLowerCase().includes(".dxf");
  const odaToken = JSON.parse(
    localStorage.getItem(`${USER_ODA}_${user_vina_id}`),
  )?.tokenInfo.token;
  const userObj = JSON.parse(
    localStorage.getItem(`${USER_VINA}_${user_vina_id}`) || "{}",
  );

  return isDWG || canOpen ? (
    <Link
      className={classNames("ant-typography", className)}
      to={isDWG ? null : `/my-files/${file.id}?n=${file.name} ${isTocViewer ? '&viewer=toc' : ''}`}
      onClick={(e) => {
        if (isDWG) {
          e.preventDefault();

          createEventToTrackingSession({
            event: "open_file",
            meta: createTeraTrackingPageMeta("my-files", {
              action: "open_in_cad_viewer",
              extension: file.name?.split(".").pop()?.toLowerCase(),
              fileId: file.id,
              fileName: file.name,
            }),
          });

          if (file?.sharedLinkToken) {
            window.open(
              `${import.meta.env.VITE_APP_CAD_INWEB_URL}/${lang}?from=vinacad&fileId=${file.id}&token=${file.sharedLinkToken}&email=${userObj?.email}&firstName=${userObj?.firstName}&lastName=${userObj?.lastName}&fileName=${file.name}&share=true`,
              "_blank",
            );
          }
          window.open(
            `${import.meta.env.VITE_APP_CAD_INWEB_URL}/${lang}?from=vinacad&fileId=${file.id}&token=${odaToken}&email=${userObj?.email}&firstName=${userObj?.firstName}&lastName=${userObj?.lastName}&fileName=${file.name}`,
            "_blank",
          );
        }
      }}
    >
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

class Files extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewStyle: "table",
      files: [],
      fontFiles: [],
      loading: true,
      error: "",
      total: 0,
      page: sessionStorage.getItem(CURRENT_PAGE) || 1,
      pageSize: 10,
      filters: {
        name: "",
        type: "DGN|DWF|DWG|DXF|IFC|IFCZIP|NWC|NWD|OBJ|RCS|RFA|RVT|STEP|STL|STP|VSFX|IFCX|USDZ",
      },
      selectedFiles: [],
      selectedFile: {},
      fileUploadModal: false,
      createAssemblyModal: false,
      fileVersionsModal: false,
      scrollY: "calc(100svh - 235px)",
      visibleModal: false,
      previewId: null,
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 768,
      shareModal: false,
      shareViewFilter: "all",
      userFileInfo: {},
      odaToken: JSON.parse(
        localStorage.getItem(`${USER_ODA}_${getUserIdLogin()}`),
      )?.tokenInfo.token,
      userObj: JSON.parse(
        localStorage.getItem(`${USER_VINA}_${getUserIdLogin()}`) || "{}",
      ),
      lang: localStorage.getItem("i18nextLng"),
    };
    const supportFormats = ClientFactory.getConfig().supportFormats;
    this.supportFormats = new Map();
    supportFormats.forEach((format) =>
      this.supportFormats.set(`.${format.toLowerCase()}`, 0),
    );
    this.isPollingFiles = false;
    this.createdJobsByFileId = new Map();
    this.searchDebounceTimeout = null;
  }

  hasProcessingFiles = (files = []) => {
    return files.some((file) => this.getProcessingStatuses(file).length > 0);
  };

  getProcessingStatuses = (file) => {
    if (!this.supportFormats.has(file.type?.toLowerCase())) return [];

    return Object.entries(file.status || {}).filter(([name, status]) => {
      return (
        ["geometry", "properties"].includes(name) &&
        ["waiting", "inprogress"].includes(status?.state)
      );
    });
  };

  needsFreshFileStatus = (file) => {
    if (!this.supportFormats.has(file.type?.toLowerCase())) return false;

    return ["geometry", "properties"].some((job) =>
      ["none", "waiting", "inprogress"].includes(file.status?.[job]?.state),
    );
  };

  getFreshJob = async (jobId) => {
    const client = ClientFactory.get();
    const response = await client.httpClient.get(
      `/jobs/${jobId}?_=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );

    return await response.json();
  };

  getFreshJobs = async () => {
    const client = ClientFactory.get();
    const searchParams = new URLSearchParams({
      limit: "200",
      sortBy: "desc",
      _: Date.now().toString(),
    });

    const response = await client.httpClient.get(`/jobs?${searchParams}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    const jobs = await response.json();

    return jobs.result || [];
  };

  isGeometryReady = async (fileId) => {
    const client = ClientFactory.get();

    try {
      const response = await client.httpClient.get(
        `/files/${fileId}/geometry?_=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );
      await response.json();
      return true;
    } catch (e) {
      return false;
    }
  };

  async deleteShareFile(sharedLinkToken) {
    await axiosInstance.delete(`/shared-files/${sharedLinkToken}`);
  }

  getRecentJobsByFileAndOutput = async (files = []) => {
    const needsRecentJobs = files.some((file) => {
      if (!this.needsFreshFileStatus(file)) return false;
      const createdJobs = this.createdJobsByFileId.get(file.id) || {};

      return ["geometry", "properties"].some((job) => {
        const status = file.status?.[job] || {};
        return !status.jobId && !createdJobs[job]?.id;
      });
    });

    if (!needsRecentJobs) return new Map();

    try {
      const jobs = await this.getFreshJobs();
      const fileIds = new Set(files.map((file) => file.id));
      const jobsByFileAndOutput = new Map();

      jobs.forEach((job) => {
        if (
          !fileIds.has(job.fileId) ||
          !["geometry", "properties"].includes(job.outputFormat)
        ) {
          return;
        }

        const key = `${job.fileId}:${job.outputFormat}`;
        if (!jobsByFileAndOutput.has(key)) jobsByFileAndOutput.set(key, job);
      });

      return jobsByFileAndOutput;
    } catch (e) {
      console.error("Cannot refresh jobs.", e);
      return new Map();
    }
  };

  mergeFreshJobStatuses = async (file, jobsByFileAndOutput = new Map()) => {
    if (!this.needsFreshFileStatus(file)) return file;

    const client = ClientFactory.get();
    const createdJobs = this.createdJobsByFileId.get(file.id) || {};
    const status = { ...file.status };

    for (const jobName of ["geometry", "properties"]) {
      const currentStatus = status[jobName] || {};
      const recentJob = jobsByFileAndOutput.get(`${file.id}:${jobName}`);
      const createdJob = createdJobs[jobName];
      const jobId = currentStatus.jobId || createdJob?.id || recentJob?.id;

      if (!jobId) continue;

      let job = recentJob?.id === jobId ? recentJob : createdJob;

      if (!job || ["waiting", "inprogress"].includes(job.status)) {
        try {
          job = await this.getFreshJob(jobId);
        } catch (e) {
          console.error(`Cannot refresh job ${jobId}.`, e);
        }
      }

      if (!job?.status) continue;

      if (jobName === "geometry" && job.status === "done") {
        const geometryReady = await this.isGeometryReady(file.id);

        if (!geometryReady) {
          status[jobName] = {
            ...currentStatus,
            state: "inprogress",
            jobId: job.id,
            statusMessage: "Geometry is finalizing",
          };
          continue;
        }
      }

      status[jobName] = {
        ...currentStatus,
        state: job.status,
        jobId: job.id,
        statusMessage: job.statusMessage,
      };
    }

    const fileData = file._data || file.data || file;

    return new OdaFile(
      {
        ...fileData,
        status,
      },
      client.httpClient,
    );
  };

  mergeFreshFileStatuses = async (files = []) => {
    const jobsByFileAndOutput = await this.getRecentJobsByFileAndOutput(files);

    return await Promise.all(
      files.map(async (file) => {
        return await this.mergeFreshJobStatuses(file, jobsByFileAndOutput);
      }),
    );
  };

  getPollingFiles = async () => {
    const latestFiles = await this.getFreshFiles(0, 100, "", "", null, true);
    latestFiles.result = await this.mergeFreshFileStatuses(latestFiles.result);

    if (!this.hasProcessingFiles(this.state.files)) {
      return latestFiles.result;
    }

    const latestFileIds = new Set(latestFiles.result.map((file) => file.id));
    const hasMissingProcessingFile = this.state.files.some((file) => {
      return this.hasProcessingFiles([file]) && !latestFileIds.has(file.id);
    });

    if (!hasMissingProcessingFile) {
      return latestFiles.result;
    }

    const { page, pageSize, filters, shareViewFilter } = this.state;
    const isShareView = shareViewFilter === "shared";
    const currentFiles = await this.getFreshFiles(
      isShareView ? 0 : (page - 1) * pageSize,
      isShareView ? 99999 : pageSize,
      filters.name,
      filters.type,
      null,
      true,
    );
    currentFiles.result = await this.mergeFreshFileStatuses(
      currentFiles.result,
    );
    const pollingFilesById = new Map();

    [...latestFiles.result, ...currentFiles.result].forEach((file) => {
      pollingFilesById.set(file.id, file);
    });

    return Array.from(pollingFilesById.values());
  };

  syncPolledFiles = (latestFiles = []) => {
    const latestFilesById = new Map(latestFiles.map((file) => [file.id, file]));

    if (!latestFilesById.size) return;

    this.setState(({ files, selectedFile, selectedFiles }) => {
      const syncedFiles = files.map(
        (file) => latestFilesById.get(file.id) || file,
      );

      return {
        files: syncedFiles,
        selectedFile: latestFilesById.get(selectedFile.id) || selectedFile,
        selectedFiles: selectedFiles.map(
          (file) => latestFilesById.get(file.id) || file,
        ),
      };
    });
  };

  pollFilesStatus = async () => {
    if (this.isPollingFiles) return;
    if (!this.hasProcessingFiles(this.state.files)) return;

    this.isPollingFiles = true;

    try {
      const latestFiles = await this.getPollingFiles();
      const hasProcessingLatestFiles = this.hasProcessingFiles(latestFiles);
      const hadProcessingFiles = this.hasProcessingFiles(this.state.files);

      if (hasProcessingLatestFiles) {
        await this.updateStatusFilePublic();
        await this.getFiles(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          { silent: true },
        );
        return;
      }

      if (hadProcessingFiles) {
        await this.updateStatusFilePublic();
        this.syncPolledFiles(latestFiles);
      }
    } catch (e) {
      console.error("Cannot poll files.", e);
    } finally {
      this.isPollingFiles = false;
    }
  };

  getJobParameters(fileName, job) {
    const { jobParameters } = ClientFactory.getConfig();
    const { [job]: parameters, overrides } = jobParameters || {};
    if (parameters && overrides) {
      const overrideList = Array.isArray(overrides) ? overrides : [overrides];
      for (const override of overrideList) {
        if (
          picomatch.isMatch(fileName, override.files, {
            ignore: override.excludeFiles,
            basename: true,
            dot: true,
          })
        ) {
          const overrideParameters = override[job];
          if (typeof overrideParameters === "string") return overrideParameters;
          Object.assign(parameters, overrideParameters);
        }
      }
      Object.entries(parameters)
        .filter(([key, value]) => value === null)
        .forEach(([key, value]) => delete parameters[key]);
    }
    return parameters;
  }

  async componentDidMount() {
    this.setState({
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 768,
    });

    await this.getFiles();
    this.intervalId = setInterval(this.pollFilesStatus, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = null;
  }

  getAuthCodeOpenApp = async (file) => {
    const { refresh, oda } = this.props.data;
    const userId = getUserIdLogin();
    const canOpenVinaCAD = VINA_CAD_ACCEPT_FILE_DEFAULT.includes(
      file.type.toUpperCase(),
    );
    const canOpenVinaBIM = VINA_BIM_ACCEPT_FILE_DEFAULT.includes(
      file.type.toUpperCase(),
    );
    try {
      const refToken = Cookies.get(`${REFRESH_TOKEN_KEY}_${userId}`);
      const odaToken = JSON.parse(localStorage.getItem(`${USER_ODA}_${userId}`))
        ?.tokenInfo.token;

      const res = await axiosInstance.post("/oauth/auth-code", {
        code: refToken ?? refresh,
      });

      const { accessToken, refreshToken } = res.data;

      createEventToTrackingSession({
        event: "open_family_desktop_app",
        meta: createTeraTrackingPageMeta("my_files", {
          action: "open_desktop_app",
          app: canOpenVinaCAD ? VINA_CAD_APP : VINA_BIM_APP,
          fileType: file.type,
          fileId: file.id,
          fileName: file.name,
        }),
      });

      window.open(
        `${canOpenVinaCAD ? VINA_CAD_APP : canOpenVinaBIM ? VINA_BIM_APP : null
        }://app=${canOpenVinaCAD ? VINA_CAD_APP : canOpenVinaBIM ? VINA_BIM_APP : null
        }&ac=${accessToken}&rf=${refreshToken}&ot=${odaToken ?? oda?.tokenInfo?.token
        }&fileId=${file.id}&u=${userId}&fileName=${canOpenVinaCAD
          ? `vinacad.${file?._data?.name?.split(".").pop()}`
          : canOpenVinaBIM
            ? `vinabim.${file?._data?.name?.split(".").pop()}`
            : null
        }`,
        "_self",
      );
    } catch (e) {
      console.error("Error fetching auth code", e);
    }
  };

  getShareToken = async (file) => {
    if (
      file?.name?.toLowerCase().includes(".dwg") ||
      file?.name?.toLowerCase().includes(".dxf")
    ) {
      const client = ClientFactory.get();
      const res = await client.getFile(
        file?.versions[file.activeVersion].fileId,
      );
      return res?.sharedLinkToken;
    }
  };

  getFreshFiles = async (
    start,
    limit,
    name,
    ext,
    ids,
    sortByDesc,
    sortField,
    shared,
  ) => {
    const client = ClientFactory.get();
    const searchParams = new URLSearchParams();

    if (start > 0) searchParams.set("start", start.toString());
    if (limit > 0) searchParams.set("limit", limit.toString());
    if (name) searchParams.set("name", name);
    if (ext) {
      const extValue = normalizeParam(ext);
      if (extValue) searchParams.set("ext", extValue.toLowerCase());
    }
    if (ids) {
      const idsValue = normalizeParam(ids);
      if (idsValue) searchParams.set("id", idsValue);
    }
    if (sortByDesc !== undefined) {
      searchParams.set("sortBy", sortByDesc ? "desc" : "asc");
    }
    if (sortField) searchParams.set("sortField", sortField);
    if (shared) searchParams.set("shared", "true");

    searchParams.set("_", Date.now().toString());

    const response = await client.httpClient.get(`/files?${searchParams}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    const files = await response.json();

    return {
      ...files,
      result: files.result.map((data) => new OdaFile(data, client.httpClient)),
    };
  };

  getFiles = async (
    page,
    pageSize,
    name,
    type,
    sortByDesc,
    sortField,
    options = {},
  ) => {
    const { silent = false } = options;
    const { filters, shareViewFilter } = this.state;
    const isShareView = shareViewFilter === "shared";
    if (page === undefined) page = this.state.page;
    if (pageSize === undefined) pageSize = this.state.pageSize;
    if (name === undefined) name = filters.name;
    if (type === undefined) type = filters.type;
    this.setState({
      filters: { name, type },
      ...(silent ? {} : { loading: true, error: "" }),
    });
    try {
      const files = await this.getFreshFiles(
        isShareView ? 0 : (page - 1) * pageSize,
        isShareView ? 99999 : pageSize,
        name,
        type,
        null,
        sortByDesc ?? true,
        sortField,
      );
      files.result = await this.mergeFreshFileStatuses(files.result);
      // if (!isShareView) {
      // }
      for (const file of files.result) {
        if (
          file.status.geometry.state === "none" &&
          !this.createdJobsByFileId.has(file.id)
          // (file.name?.toLowerCase()?.includes(".dwg") ||
          //   file.name?.toLowerCase()?.includes(".dxf"))
        ) {
          const geometryJob = await file.createJob(
            "geometry",
            this.getJobParameters(file.name, "geometry"),
          );
          const propertiesJob = await file.createJob(
            "properties",
            this.getJobParameters(file.name, "properties"),
          );
          this.createdJobsByFileId.set(file.id, {
            geometry: geometryJob,
            properties: propertiesJob,
          });
          this.getFiles(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { silent },
          );
        }
      }

      const fontFile = await this.getFreshFiles(
        (page - 1) * pageSize,
        1000,
        name,
        "ttf|otf|woff|woff2",
        null,
        sortByDesc ?? true,
        sortField,
      );

      const response = await axiosInstance.get(`/files/all-size?limit=99999`);
      if (response) {
        this.setState({
          userFileInfo: response.data,
        });
        this.props?.fetchAllSizeFiles(99999);
      }

      const fontFiles = fontFile.result;

      const filesWithToken = await Promise.all(
        files.result.map(async (file) => {
          const token = await this.getShareToken(file?._data);
          if (token && file?._data) file._data.sharedLinkToken = token;
          return file;
        }),
      );

      const visibleFiles = isShareView
        ? filesWithToken.filter((file) =>
          Boolean(file?.sharedLinkToken || file?._data?.sharedLinkToken),
        )
        : filesWithToken;

      const currentPage = isShareView
        ? Math.min(page, Math.max(1, Math.ceil(visibleFiles.length / pageSize)))
        : page;

      const paginatedFiles = isShareView
        ? visibleFiles.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize,
        )
        : visibleFiles;

      const selectedFile =
        visibleFiles.find((x) => x.id === this.state.selectedFile.id) || {};
      const selectedFiles = visibleFiles.filter((x) =>
        this.state.selectedFiles.some((y) => x.id === y.id),
      );

      this.setState({
        fontFiles,
        files: paginatedFiles,
        ...(silent ? {} : { loading: false }),
        total: isShareView ? visibleFiles.length : files.allSize,
        page: currentPage,
        pageSize,
        selectedFile,
        selectedFiles,
      });
    } catch (e) {
      console.error("Cannot load files.", e);
      if (!silent) {
        this.setState({ loading: false, error: e.message });
        notification.error({
          message: t("Error"),
          description: t("Cannot get files"),
        });
      }
    }
  };

  updateStatusFilePublic = async () => {
    try {
      await axiosInstance.put("/file-public/file");
    } catch (error) {
      console.log(error);
    }
  };

  deleteFileShare = async (fileId) => {
    await axiosInstance.delete(`/file-public?fileId=${fileId}`);
  };

  deleteFile = (file) => {
    file
      .delete()
      .then((data) => {
        const { files, total } = this.state;
        this.setState({
          files: files.filter((x) => x.id !== data.id),
          total: total - 1,
        });
        this.getFiles();
        this.deleteFileShare(file.id);
        notification.success({
          message: t("Success"),
          description: t("File deleted"),
        });
      })
      .catch((e) => {
        console.error("Cannot delete file.", e);
        notification.error({
          message: "Error",
          description: t("Cannot delete file"),
        });
      });
  };

  downloadSource = (file) => {
    file
      .download()
      .then((arrayBuffer) => {
        const blob = new Blob([arrayBuffer]);
        FileSaver.saveAs(blob, sanitize(file.name));
        notification.success({
          message: "Success",
          description: t("File downloaded"),
        });
      })
      .catch((e) => {
        console.error("Cannot download file.", e);
        notification.error({
          message: "Error",
          description: t("Cannot download file"),
        });
      });
  };

  handleTableChange = async (pagination, filters, sorter) => {
    this.setState({
      page: pagination.current,
      pageSize: pagination.pageSize,
    });
    sessionStorage.setItem(CURRENT_PAGE, pagination.current);
    await this.getFiles(
      pagination.current,
      pagination.pageSize,
      filters.name || [],
      this.state.filters.type || [],
      sorter.order ? sorter.order === "descend" : undefined,
      sorter.order ? sorter.field : undefined,
    );
  };

  onSearch = async (filter = "") => {
    if (this.state.page !== 1) {
      this.state.page = 1;
    }
    this.state.filters.name = filter;
    await this.getFiles();
  };

  handleSearchChange = (value = "") => {
    clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = setTimeout(() => {
      this.onSearch(value);
    }, 300);
  };

  handleShareViewChange = (shareViewFilter) => {
    sessionStorage.setItem(CURRENT_PAGE, 1);
    this.setState(
      {
        shareViewFilter,
        page: 1,
      },
      () => {
        this.getFiles(1, this.state.pageSize);
      },
    );
  };

  newFile = () => {
    createEventToTrackingSession({
      event: "new_drawing",
      meta: createTeraTrackingPageMeta("my-files", {
        action: "new_drawing_in_cad_viewer",
      }),
    });

    window.open(
      `${import.meta.env.VITE_APP_CAD_INWEB_URL}/${this.state.lang}?from=vinacad&token=${this.state.odaToken}&email=${this.state.userObj?.email}&firstName=${this.state.userObj?.firstName}&lastName=${this.state.userObj?.lastName}`,
      "_blank",
    );
  };

  render() {
    const {
      files,
      total,
      page,
      pageSize,
      filters,
      loading,
      error,
      selectedFiles,
      selectedFile,
      fileUploadModal,
      createAssemblyModal,
      fileVersionsModal,
      scrollY,
      isMobile,
      windowWidth,
      shareModal,
      shareViewFilter,
    } = this.state;
    const { access, refresh, oda, userId } = this.props.data;
    const storageLimit = this.props.storageLimit;
    const userFileInfo = this.props.userFileInfo;
    const isTablet = windowWidth >= 768 && windowWidth <= 1024;

    const columns = [
      {
        title: t("#"),
        dataIndex: "index",
        render: (_, record, index) => (page - 1) * pageSize + index + 1,
        width: "50px",
        ellipsis: true,
        align: "center",
      },
      ...(!isTablet
        ? [
          {
            title: "",
            dataIndex: "openApp",
            responsive: ["md"],
            render: (name, file) => {
              const canOpenVinaCAD = VINA_CAD_ACCEPT_FILE_DEFAULT.includes(
                file.type.toUpperCase(),
              );
              const canOpenVinaBIM = VINA_BIM_ACCEPT_FILE_DEFAULT.includes(
                file.type.toUpperCase(),
              );
              return (
                <Button
                  title={
                    canOpenVinaCAD
                      ? t("Allow open file VinaCAD")
                      : canOpenVinaBIM
                        ? t("Allow open file VinaBIM")
                        : null
                  }
                  className="cursor-pointer open-app-btn"
                  disabled={!canOpenVinaCAD && !canOpenVinaBIM}
                  style={{ fontSize: "12px" }}
                  onClick={() => this.getAuthCodeOpenApp(file)}
                >
                  <p className="d-flex align-items-center mb-0">
                    <img
                      style={{ width: "15px", height: "15px" }}
                      className="mr-2"
                      src={canOpenVinaBIM ? logoBim : logo}
                      alt="Logo"
                    />
                    {canOpenVinaBIM ? t("Open VinaBIM") : t("Open VinaCAD")}
                  </p>
                </Button>
              );
            },
            align: "center",
            width: "170px",
          },
        ]
        : []),
      {
        title: t("Name"),
        dataIndex: "name",
        render: (name, file) => {
          // const canOpen = file.status.geometry.state === "done";
          const processingStatuses = this.getProcessingStatuses(file);
          const hasWaitingStatus = processingStatuses.some(
            ([, status]) => status?.state === "waiting",
          );
          const hasInProgressStatus = processingStatuses.some(
            ([, status]) => status?.state === "inprogress",
          );
          const showProcessingIndicator = isMobile
            ? processingStatuses.length > 0
            : hasWaitingStatus && !hasInProgressStatus;

          return (
            <div style={{ display: "flex", alignContent: "center" }}>
              {/* <Tooltip title={t("Preview")}>
              </Tooltip> */}
              <div
                style={{ cursor: "pointer" }}
              // onClick={() => {
              //   canOpen
              //     ? this.setState({
              //         visibleModal: true,
              //         previewId: file.id,
              //       })
              //     : null;
              // }}
              >
                <FileTypeIcon className="mr-2" fileName={file.name} />
              </div>
              <ViewerLink
                className="d-flex align-items-center flex-nowrap"
                file={file}
                canOpen={true}
                isTocViewer
              >
                <Text
                  className="text-reset mr-2 text-truncate"
                  ellipsis={{ tooltip: true }}
                  style={{ maxWidth: isMobile ? "200px" : "400px" }}
                >
                  {name}
                </Text>
                {
                  // !file.name?.toLowerCase()?.includes(".dwg") &&
                  //   !file.name?.toLowerCase()?.includes(".dxf") &&
                  Object.entries(file.status)
                    .filter(([name, status]) =>
                      ["geometry", "properties"].includes(name),
                    )
                    .filter(([name, status]) => {
                      const isHidden = ["none", "done"].includes(status.state);

                      const prevKey = `prev-status-${file.id}-${name}`;
                      const prevState = window[prevKey];

                      if (
                        prevState &&
                        !["none", "done"].includes(prevState) &&
                        isHidden
                      ) {
                        setTimeout(() => {
                          window.dispatchEvent(
                            new CustomEvent("load-geometry-done", {
                              detail: { fileId: file.id },
                            }),
                          );
                        }, 0);
                      }

                      window[prevKey] = status.state;

                      return !isHidden;
                    })
                    .map(([name, status]) => (
                      <StatusTag
                        key={name}
                        className="d-none d-lg-inline-block font-size-sm"
                        status={status.state}
                        name={name}
                      />
                    ))
                }
                {showProcessingIndicator && (
                  <Tooltip title={t("Processing file")}>
                    <LoadingOutlined
                      spin
                      className="file-processing-indicator"
                      aria-label={t("Processing file")}
                    />
                  </Tooltip>
                )}
              </ViewerLink>
            </div>
          );
        },
        // ...NameFilter(t('Lọc theo tên')),
        ellipsis: true,
      },
      {
        title: t("Size"),
        dataIndex: "size",
        render: (size) =>
          bytes.format(size, { decimalPlaces: 1, unitSeparator: " " }),
        width: "8%",
        ellipsis: true,
        responsive: ["lg"],
      },
      {
        title: t("Shared"),
        dataIndex: "sharedLinkToken",
        render: (sharedLinkToken, file) => {
          return file.status.geometry.state === "done" ||
            file.name?.toLowerCase()?.includes(".dwg") ||
            file.name?.toLowerCase()?.includes(".dxf") ? (
            sharedLinkToken ? (
              <CheckCircleTwoTone
                onClick={() =>
                  this.setState({ selectedFile: file, shareModal: true })
                }
              />
            ) : (
              <ShareAltOutlined
                onClick={() =>
                  this.setState({ selectedFile: file, shareModal: true })
                }
              />
            )
          ) : (
            <StopOutlined />
          );
        },
        width: "10%",
        // ...SharedFilter(),
        ellipsis: true,
        responsive: ["sm"],
      },
      {
        title: t("Last Updated"),
        dataIndex: "updatedAt",
        render: (updatedAt) =>
          moment(updatedAt).format(t("DD-MM-YYYY HH:mm:ss")),
        width: "15%",
        ellipsis: true,
        responsive: ["md"],
      },
      {
        title: "",
        key: "actions",
        render: (_, file) => {
          const canOpen = file.status.geometry.state === "done";
          const isDWG =
            file?.name?.toLowerCase().includes(".dwg") ||
            file?.name?.toLowerCase().includes(".dxf");

          return (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "open",
                    label: (
                      <ViewerLink
                        className="text-reset"
                        file={file}
                        canOpen={true}
                        isTocViewer
                      >
                        {t("View detail")}
                      </ViewerLink>
                    ),
                    icon: <DesktopOutlined className="menu-icon" />,
                    // disabled: !canOpen,
                  },
                  {
                    key: "visualize",
                    label: (
                      <ViewerLink
                        className="text-reset"
                        file={file}
                        canOpen={canOpen}
                      >
                        {t("viewVisualize")}
                      </ViewerLink>
                    ),
                    icon: <DeploymentUnitOutlined className="menu-icon" />,
                    disabled: !canOpen || isDWG,
                  },
                  {
                    key: "download",
                    label: t("Download source file"),
                    icon: <DownloadOutlined className="menu-icon" />,
                  },
                  file.status.geometry.state === "done" && {
                    key: "share",
                    label: t("Share"),
                    icon: <ShareAltOutlined className="menu-icon" />,
                  },
                  {
                    key: "delete",
                    label: t("Delete file"),
                    icon: <DeleteOutlined className="menu-icon" />,
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "download") {
                    this.downloadSource(file);

                    createEventToTrackingSession({
                      event: "download_file",
                      meta: createTeraTrackingPageMeta("my-files", {
                        action: "download",
                        extension: file.name?.split(".").pop()?.toLowerCase(),
                        fileId: file.id,
                        fileName: file.name,
                      }),
                    });
                  }
                  if (key === "versions")
                    this.setState({
                      selectedFile: file,
                      fileVersionsModal: true,
                    });
                  if (key === "share")
                    this.setState({ selectedFile: file, shareModal: true });
                  if (key === "delete") {
                    Modal.confirm({
                      title: (
                        <span style={{ fontSize: 15, fontWeight: 600 }}>
                          {t("Delete file")}
                        </span>
                      ),
                      content: (
                        <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                          {file?.sharedLinkToken
                            ? t("delete_file_shared")
                            : t("Delete the file?")}
                        </span>
                      ),
                      centered: true,
                      width: 360,
                      icon: null,
                      okText: t("Delete"),
                      cancelText: t("Cancel"),
                      okButtonProps: {
                        danger: true,
                      },
                      onOk: async () => {
                        await this.deleteFile(file);

                        if (file?.sharedLinkToken) {
                          await this.deleteShareFile(file.sharedLinkToken);
                        }

                        createEventToTrackingSession({
                          event: "delete_file",
                          meta: createTeraTrackingPageMeta("my-files", {
                            action: "delete",
                            extension: file.name?.split(".").pop()?.toLowerCase(),
                            fileId: file.id,
                            fileName: file.name,
                          }),
                        });
                      },
                    });
                  }
                },
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                shape="circle"
                icon={<MoreOutlined />}
                className="border-0 bg-transparent shadow-none"
              />
            </Dropdown>
          );
        },
        align: "center",
        width: "3em",
      },
    ];

    const filtered = filters.name.length > 0 || filters.type.length > 0;
    const emptyText = error
      ? t("Error loading files")
      : loading
        ? " "
        : filtered
          ? t("No files matching the filter")
          : t("No files. To add a new file, click Upload File button.");

    const lang = localStorage.getItem("i18nextLng");

    const pagination = {
      showSizeChanger: true,
      showLessItems: true,
      responsive: true,
      disabled: loading,
      total,
      current: page,
      pageSize,
      // size: "large",
    };

    return (
      <div className="my-files h-100 d-flex flex-column">
        <div
          className={`action-container d-flex justify-content-between ${store.getState().app.isAdminMode ? "admin-mode" : ""}`}
        >
          <div className="d-flex gap-2">
            <Button
              key="upload"
              type="primary"
              icon={<UploadOutlined />}
              disabled={
                // loading ||
                error || this.state.userFileInfo.totalSize > storageLimit
              }
              onClick={() => this.setState({ fileUploadModal: true })}
              className="action-upload-button"
            >
              <span>{t("Upload")}</span>
            </Button>
            <Button
              key="new-file"
              type="primary"
              icon={<PlusOutlined />}
              disabled={
                // loading ||
                error || this.state.userFileInfo.totalSize > storageLimit
              }
              onClick={() => this.newFile()}
              className="action-upload-button"
            >
              <span>{t("New File")}</span>
            </Button>
            {!isMobile && (
              <StorageUsage
                storageLimit={storageLimit}
                userFileInfo={userFileInfo}
              />
            )}
          </div>
          <div className="d-flex gap-2">
            <Select
              style={{ width: 100 }}
              value={shareViewFilter}
              options={[
                { label: t("All"), value: "all" },
                { label: t("Shared"), value: "shared" },
              ]}
              onChange={this.handleShareViewChange}
            />
            <Search
              placeholder={t("Filter by file")}
              allowClear
              // onSearch={(value) => this.onSearch(value)}
              onChange={(e) => this.handleSearchChange(e.target.value)}
              style={{
                width: 250,
              }}
              className="action-search"
            />
          </div>
        </div>
        <div
          className={`align-self-stretch overflow-auto bg-gray ${store.getState().app.isAdminMode ? "admin-mode" : ""}`}
        >
          <div className="table-container">
            <ConfigProvider
              renderEmpty={() => <Empty description={emptyText} />}
            >
              <Table
                size={isMobile ? "small" : "middle"}
                columns={columns}
                rowKey={(row) => row.id}
                dataSource={files}
                pagination={pagination}
                bordered={isMobile || isTablet ? false : true}
                rowClassName={(record, index) =>
                  classNames({
                    "ant-table-striped": index % 2 === 1,
                    "file-processing-row": this.hasProcessingFiles([record]),
                  })
                }
                loading={loading}
                scroll={{
                  x: "max-content",
                  y: !isMobile ? scrollY : "calc(100svh - 320px)",
                }}
                onChange={this.handleTableChange}
              />
            </ConfigProvider>
          </div>
        </div>
        <FileUploadModal
          visible={fileUploadModal}
          onUpload={() => {
            this.setState({ fileUploadModal: false });
            this.getFiles();
          }}
          onClose={() => this.setState({ fileUploadModal: false })}
          userFileInfo={this.state.userFileInfo}
          storageLimit={storageLimit}
          fontFiles={this.state.fontFiles}
          isFamily={false}
        />
        <CreateAssemblyModal
          visible={createAssemblyModal}
          selected={selectedFiles}
          onCreate={() =>
            this.setState({ selectedFiles: [], createAssemblyModal: false })
          }
          onClose={() => this.setState({ createAssemblyModal: false })}
        />
        <FileVersionsModal
          visible={fileVersionsModal}
          fileId={selectedFile.id}
          onChangeVersion={(file) => {
            selectedFile.data = file.data;
            this.setState({ refreshId: new Date() });
          }}
          onClose={() => this.setState({ fileVersionsModal: false })}
        />
        {this.state.visibleModal && (
          <PreviewModal
            visible={this.state.visibleModal}
            set={(visible) => this.setState({ visibleModal: visible })}
            fileId={this.state.previewId}
          />
        )}
        <ShareModal
          visible={shareModal}
          fileId={selectedFile.id}
          onShareUnshare={() => this.getFiles()}
          onClose={() => this.setState({ shareModal: false })}
          fileActive={selectedFile}
        />
      </div>
    );
  }
}

export default withTranslation()(Files);
