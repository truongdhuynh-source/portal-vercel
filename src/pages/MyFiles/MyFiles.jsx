import React from "react";
import "./MyFiles.css";
import { Tabs } from "antd";
import i18next from "i18next";
import { withTranslation } from "react-i18next";
import MyFamilies from "../MyFamilies/MyFamilies";
import PublicFamilies from "../PublicFamilies/PublicFamilies";
import Cookies from "js-cookie";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_ODA,
  CURRENT_PAGE,
  CURRENT_TAB,
} from "@/constants";
import getUserIdLogin from "@/utils/getUserIdLogin";
import Files from "../../oda-sdk/views/Files";
import bytes from "bytes";
import axiosInstance from "@/plugins/axios";
import StorageUsage from "@/components/StorageUsage/StorageUsage";
import PortalHeader from "@/components/PortalHeader";

const t = i18next.t;

class MyFiles extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {},
      userFileInfo: {},
      storageLimit: 0,
      tab: sessionStorage.getItem(CURRENT_TAB) || "1",
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 768,
    };
  }

  async componentDidMount() {
    const windowWidth = window.innerWidth;
    this.setState({
      windowWidth,
      isMobile: windowWidth < 768,
    });
    const userId = getUserIdLogin();
    this.setState({
      data: this.props.data,
    });

    await this.fetchAllSizeFiles(10000);
  }

  fetchAllSizeFiles = async (limit) => {
    try {
      const user_vina_id = getUserIdLogin();
      const user =
        JSON.parse(localStorage.getItem(`${USER_ODA}_${user_vina_id}`)) || {};
      const response = await axiosInstance.get(
        `/files/all-size?limit=${limit}`,
      );
      if (response) {
        this.setState({
          storageLimit: user.storageLimit,
          userFileInfo: response.data,
        });
      }
    } catch (e) {
      console.error("Error fetching all size files:", e);
    }
  };

  onTabChange = (key) => {
    sessionStorage.removeItem(CURRENT_PAGE);
    sessionStorage.setItem(CURRENT_TAB, key);
    this.setState({ tab: key });
  };

  render() {
    const { data, storageLimit, userFileInfo, isMobile, windowWidth } =
      this.state;

    const operations = (
      <StorageUsage storageLimit={storageLimit} userFileInfo={userFileInfo} />
    );

    return (
      <div className="my-files-page">
        <Files
          data={data}
          storageLimit={storageLimit}
          userFileInfo={userFileInfo}
          fetchAllSizeFiles={this.fetchAllSizeFiles}
          storageUsageOperations={operations}
        />
      </div>
    );
  }
}

export default withTranslation()(MyFiles);
