import React from "react";
import { Layout, Typography, Card, Button, Space, Divider, List } from "antd";
import { ArrowLeft, FileCheck, Cloud, CheckCircle, UserCheck, AlertTriangle, Mail } from "lucide-react";

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function TermsOfUse() {
    const currentYear = new Date().getFullYear();

    const restrictions = [
        "Không thực hiện hoặc cố ý thực hiện các hành vi truy cập trái phép vào hệ thống.",
        "Không tải lên, phát tán phần mềm độc hại, mã độc hoặc virus gây hại cho nền tảng.",
        "Không lạm dụng, làm quá tải hoặc gây ảnh hưởng tiêu cực đến tài nguyên hệ thống.",
        "Không vi phạm quyền sở hữu trí tuệ đối với các tài liệu và mã nguồn thuộc cổng thông tin."
    ];

    return (
        <Layout style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "sans-serif" }}>
            <Content style={{ padding: "60px 16px 80px 16px" }}>
                <div style={{ maxWidth: "840px", margin: "0 auto" }}>

                    {/* Nút quay lại trang chủ */}
                    <Button
                        type="link"
                        href="/"
                        icon={<ArrowLeft size={16} />}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: 0,
                            color: "#64748b",
                            marginBottom: "24px"
                        }}
                        onMouseEnter={(e) => e.target.style.color = "#1677ff"}
                        onMouseLeave={(e) => e.target.style.color = "#64748b"}
                    >
                        Quay lại trang chủ
                    </Button>

                    {/* Khung nội dung chính */}
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: "16px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                            padding: "24px"
                        }}
                    >
                        {/* Header của văn bản */}
                        <div style={{ marginBottom: "40px" }}>
                            <span
                                style={{
                                    background: "#eef2ff",
                                    color: "#4f46e5",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Văn bản pháp lý
                            </span>

                            <Title level={1} style={{ marginTop: "16px", marginBottom: "8px", fontWeight: 800, color: "#1f2937" }}>
                                Điều khoản Sử dụng (Terms of Use)
                            </Title>

                            <Text type="secondary" style={{ fontSize: "14px" }}>
                                Cập nhật lần cuối: Tháng 6 năm {currentYear}
                            </Text>

                            <Divider style={{ margin: "24px 0 0 0" }} />
                        </div>

                        {/* Các điều khoản chi tiết */}
                        <Typography>

                            {/* Mục 1 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <FileCheck size={20} style={{ color: "#4f46e5" }} /> 1. Chấp thuận các điều khoản
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Bằng việc truy cập, duyệt hoặc sử dụng ứng dụng này, bạn xác nhận rằng mình đã đọc, hiểu và đồng ý chịu sự ràng buộc bởi các <strong>Điều khoản Sử dụng</strong> này cũng như tất cả các quy định pháp luật hiện hành.
                                </Paragraph>
                            </div>

                            {/* Mục 2 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <Cloud size={20} style={{ color: "#4f46e5" }} /> 2. Tính năng liên kết Google Drive
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Ứng dụng cung cấp các công cụ cho phép người dùng thực hiện các thao tác: duyệt, tải lên, tải về, tổ chức, di chuyển, đổi tên và quản lý toàn diện các tệp tin cũng như thư mục kỹ thuật được lưu trữ trên tài khoản Google Drive cá nhân hoặc doanh nghiệp của bạn.
                                </Paragraph>
                            </div>

                            {/* Mục 3 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <CheckCircle size={20} style={{ color: "#4f46e5" }} /> 3. Quy định sử dụng hợp pháp
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Khi vận hành tài khoản trên Vinacad Portal, bạn cam kết tuân thủ nghiêm ngặt các nguyên tắc sau:
                                </Paragraph>
                                <List
                                    dataSource={restrictions}
                                    renderItem={(item) => (
                                        <List.Item style={{ padding: "6px 0", border: "none", fontSize: "15px", color: "#4b5563" }}>
                                            <span style={{ color: "#4f46e5", marginRight: "10px" }}>•</span> {item}
                                        </List.Item>
                                    )}
                                />
                            </div>

                            {/* Mục 4 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <UserCheck size={20} style={{ color: "#4f46e5" }} /> 4. Trách nhiệm của người dùng
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Người dùng hoàn toàn tự chịu trách nhiệm về việc bảo mật thông tin tài khoản đăng nhập của mình, bao gồm cả các chuỗi mã xác thực (Token) liên kết. Bạn chịu trách nhiệm pháp lý đối với toàn bộ các hoạt động diễn ra dưới danh nghĩa tài khoản cá nhân của bạn trên hệ thống.
                                </Paragraph>
                            </div>

                            {/* Mục 5 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <AlertTriangle size={20} style={{ color: "#4f46e5" }} /> 5. Giới hạn trách nhiệm pháp lý
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Ứng dụng này được cung cấp dựa trên nguyên tắc <strong>"NGUYÊN TRẠNG" (AS IS)</strong> và không đi kèm bất kỳ cam kết hay bảo đảm nào. Chúng tôi không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp, gián tiếp, hoặc sự cố mất mát dữ liệu nào phát sinh từ quá trình sử dụng dịch vụ của bạn.
                                </Paragraph>
                            </div>

                            <Divider style={{ margin: "40px 0 30px 0" }} />

                            {/* Mục 6 / Liên hệ */}
                            <div style={{
                                background: "#f8fafc",
                                padding: "24px",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: "12px"
                            }}>
                                <Title level={4} style={{ margin: 0, color: "#1f2937", fontWeight: 600 }}>
                                    Liên hệ & Hỗ trợ điều khoản
                                </Title>
                                <Paragraph style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                                    Nếu bạn có bất kỳ câu hỏi nào liên quan đến văn bản Điều khoản Sử dụng này, vui lòng gửi thông tin phản hồi trực tiếp về hòm thư:
                                </Paragraph>
                                <Button
                                    type="primary"
                                    ghost
                                    icon={<Mail size={14} />}
                                    href="mailto:truong.d.huynh@prima-sol.com"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        borderRadius: "6px",
                                        fontWeight: 500,
                                        color: "#4f46e5",
                                        borderColor: "#4f46e5"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = "#fff";
                                        e.target.style.backgroundColor = "#4f46e5";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = "#4f46e5";
                                        e.target.style.backgroundColor = "transparent";
                                    }}
                                >
                                    truong.d.huynh@prima-sol.com
                                </Button>
                            </div>

                        </Typography>
                    </Card>
                </div>
            </Content>

            {/* Footer */}
            <Footer style={{ textAlign: "center", backgroundColor: "transparent", color: "#94a3b8", paddingBottom: "40px" }}>
                © {currentYear} Vinacad Portal. All rights reserved.
            </Footer>
        </Layout>
    );
}