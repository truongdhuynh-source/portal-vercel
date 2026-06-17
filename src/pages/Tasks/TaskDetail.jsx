import React, { useState, useEffect } from "react";
import { Badge, Divider, Input, Button, Avatar, Select } from "antd";
import { Comment } from "@ant-design/compatible";
import "./TaskDetail.css";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../plugins/axios";
import { feedbackStatus } from "../../models/feedback";
import moment from "moment";
import PortalHeader from "../../components/PortalHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatFullDate } from "../../utils/functions";
import { EditOutlined } from "@ant-design/icons";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";
const { TextArea } = Input;

const TasksDetail = () => {
  const { t } = useTranslation();
  const { taskId } = useParams();
  const [feedbackDetail, setFeedbackDetail] = useState({});
  const [feedbackComment, setFeedbackComment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const getFeedbackDetail = async () => {
    try {
      const response = await axiosInstance.get(`portal/feedback/${taskId}`);
      if (response) {
        setFeedbackDetail(response.data);
      }
    } catch (e) {
      console.error("Error fetching feedback:", e.message);
    }
  };
  const getFeedbackComments = async () => {
    try {
      const response = await axiosInstance.get(`feedback-comment/${taskId}`);

      if (response) {
        setFeedbackComment(response.data.result);
        // scrollToBottom(0);
      }
    } catch (e) {
      console.error("Error fetching feedback comment:", e.message);
    }
  };

  const scrollToBottom = (time) => {
    setTimeout(() => {
      const commentArray = document.getElementById("comment");
      commentArray.scrollTo({
        top: 99999999999,
        behavior: "smooth",
      });
    }, time);
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([getFeedbackDetail(), getFeedbackComments()]);
    } catch (e) {
      console.error("Error fetching feedback comment:", e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    // window.addEventListener("DOMContentLoaded", scrollToBottom);
    // scrollToBottom(1000);
  }, []);
  const updateFeedback = async () => {
    try {
      setSaving(true);
      const response = await axiosInstance.put(`/portal/feedback/${taskId}`, {
        status: feedbackDetail.status,
      });
      if (response) {
        setIsEdit(false);
        createEventToTrackingSession({
          event: "update_task_status",
          meta: createTeraTrackingPageMeta("task_detail", {
            action: "update_status",
            status: feedbackDetail.status,
            productName: feedbackDetail?.productName,
          }),
        });
        fetchData();
      }
    } catch (e) {
      console.error("Error fetching feedback comment:", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (value) => {
    feedbackDetail.status = value;
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.post(`feedback-comment`, {
        feedbackId: taskId,
        content,
      });
      if (response) {
        setContent("");
        createEventToTrackingSession({
          event: "comment_task",
          meta: createTeraTrackingPageMeta("task_detail", {
            action: "comment",
            status: feedbackDetail?.status,
            productName: feedbackDetail?.productName,
          }),
        });
        getFeedbackComments();
      }
    } catch (e) {
      console.error("Error fetching feedback comment:", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackStatusWithLabels = feedbackStatus.map((item) => ({
    ...item,
    label: t(item.label),
  }));

  return (
    <div className="h-100 d-flex flex-column ">
      {/* <PortalHeader title={t("Task Detail")} isBack={true} className="mx-3" /> */}
      <div className="task-details-page ">
        <div className="task-details-container position-relative">
          <div className="meta-info">
            <div className="meta-info-item">
              <div className="meta-info-label">{t("Product")}</div>
              {feedbackDetail?.productName ? (
                <div className="meta-info-content">
                  {feedbackDetail.productName}
                  {feedbackDetail.versionNumber
                    ? ` ${t("Version").toLowerCase()} ${feedbackDetail.versionNumber}`
                    : ""}
                </div>
              ) : (
                <div>--/--</div>
              )}
            </div>
            <Divider />
            <div className="meta-info-item">
              <div className="meta-info-label">{t("Status")}</div>
              {feedbackDetail.status && !isEdit ? (
                <div>
                  <StatusBadge
                    condition={feedbackDetail?.status}
                    statusList={feedbackStatus}
                  />
                  <EditOutlined
                    className="ml-2 cursor-pointer"
                    onClick={() => setIsEdit(true)}
                  />
                </div>
              ) : (
                <div>
                  {isEdit ? (
                    <div>
                      <Select
                        defaultValue={feedbackDetail.status}
                        placeholder={t("Select a status")}
                        style={{ width: 150 }}
                        options={feedbackStatusWithLabels}
                        onChange={handleChange}
                      />
                      <div className="d-flex justify-content-center mt-2">
                        <Button
                          type="danger"
                          className="mr-1"
                          onClick={() => setIsEdit(false)}
                        >
                          {t("Cancel")}
                        </Button>
                        <Button
                          type="primary"
                          className="ml-1"
                          loading={saving}
                          onClick={updateFeedback}
                        >
                          {t("Save")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    "--/--"
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="task-main">
            <h3 className="title">
              #{t("Feedback on")} {feedbackDetail?.productName}
            </h3>
            <p
              className="mb-3"
              style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
            >
              {feedbackDetail?.content || "--/--"}
            </p>
            <p className="mb-3">
              <span className="task-content mr-1">{t("Date sent")}:</span>
              <span>{formatFullDate(feedbackDetail?.createAt)}</span>
            </p>
            <p className="mb-0 comment-title">
              <span>
                *{t("Comment")} ({feedbackComment.length}){" "}
              </span>
            </p>
            <TextArea
              className="mt-3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              htmlType="submit"
              loading={submitting}
              onClick={onSubmit}
              type="primary"
              className="mt-2"
              disabled={!content}
            >
              {t("Comment")}
            </Button>
            <div className="comment-list mt-4">
              <div id="comment" className="group-comment">
                {feedbackComment.map((items, index) => (
                  <Comment
                    key={index}
                    author={<a>{items.fullName}</a>}
                    avatar={
                      <Avatar style={{ backgroundColor: items.color }}>
                        {items.fullName.charAt(0)}
                      </Avatar>
                    }
                    content={<p>{items.content}</p>}
                    datetime={<span>{formatFullDate(items.createAt)}</span>}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksDetail;
