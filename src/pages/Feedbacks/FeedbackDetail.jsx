import React, { useState, useEffect } from "react";
import { Divider, Input, Button, Avatar } from "antd";
import { Comment } from "@ant-design/compatible";
import "./FeedbackDetail.css";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../plugins/axios";
import { feedbackStatus } from "../../models/feedback";
import PortalHeader from "../../components/PortalHeader";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, formatFullDate } from "../../utils/functions";
import {
  createEventToTrackingSession,
  createTeraTrackingPageMeta,
} from "@/utils/teraTracking";
const { TextArea } = Input;

const FeedbackDetail = () => {
  const { t } = useTranslation();
  const { feedbackId } = useParams();
  const [feedbackDetail, setFeedbackDetail] = useState({});
  const [feedbackComment, setFeedbackComment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");

  const getFeedbackDetail = async () => {
    try {
      const response = await axiosInstance.get(`portal/feedback/${feedbackId}`);
      if (response) {
        setFeedbackDetail(response.data);
      }
    } catch (e) {
      console.error("Error fetching feedback:", e.message);
    }
  };
  const getFeedbackComments = async () => {
    try {
      const response = await axiosInstance.get(
        `feedback-comment/${feedbackId}`,
      );

      if (response) {
        setFeedbackComment(response.data.result);
        scrollToBottom(0);
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
  useEffect(() => {
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
    fetchData();
    window.addEventListener("DOMContentLoaded", scrollToBottom);
    scrollToBottom(1000);
  }, []);
  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.post(`feedback-comment`, {
        feedbackId,
        content,
      });
      if (response) {
        setContent("");
        createEventToTrackingSession({
          event: "comment_feedback",
          meta: createTeraTrackingPageMeta("feedback_detail", {
            action: "comment",
            productName: feedbackDetail?.productName,
            status: feedbackDetail?.status,
            feedbackId,
            content,
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
  return (
    <div className="h-100 d-flex flex-column">
      {/* <PortalHeader
        title={t("Feedback Detail")}
        isBack={true}
        style={{ margin: "0 12px" }}
      /> */}
      <div className="feedback-details-page ">
        <div className="feedback-details-container position-relative">
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
              <StatusBadge
                condition={feedbackDetail?.status}
                statusList={feedbackStatus}
              />
            </div>
          </div>
          <div className="feedback-main">
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
              <span className="feedback-content mr-1">{t("Date sent")}:</span>
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
                    content={
                      <div
                        dangerouslySetInnerHTML={{ __html: items.content }}
                      ></div>
                    }
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

export default FeedbackDetail;
