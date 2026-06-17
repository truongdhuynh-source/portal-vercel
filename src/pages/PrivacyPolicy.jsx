import React from "react";
import { Layout, Typography, Card, Button, Space, Divider, List } from "antd";
import { ArrowLeft, Shield, ShieldCheck, Eye, CloudLightning, Share2, Mail } from "lucide-react";

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function PrivacyPolicy() {
    const currentYear = new Date().getFullYear();

    const usages = [
        "Xác thực danh tính người dùng và bảo mật tài khoản.",
        "Cung cấp các tính năng duyệt, quản lý và đồng bộ tệp tin.",
        "Cải tiến và tối ưu hóa hiệu năng, chức năng của ứng dụng.",
        "Duy trì tính ổn định, phòng chống các hành vi xâm nhập trái phép."
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
                                    background: "#e6f4ff",
                                    color: "#0958d9",
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
                                Chính sách Bảo mật (Privacy Policy)
                            </Title>

                            <Text type="secondary" style={{ fontSize: "14px" }}>
                                Cập nhật lần cuối: Tháng 6 năm 2026
                            </Text>

                            <Divider style={{ margin: "24px 0 0 0" }} />
                        </div>

                        {/* Các điều khoản */}
                        <Typography>

                            {/* Mục 1 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <Eye size={20} style={{ color: "#1677ff" }} /> 1. Thông tin chúng tôi thu thập
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Chúng tôi có thể thu thập thông tin hồ sơ tài khoản Google của bạn, bao gồm <strong>họ tên, địa chỉ email, và ảnh đại diện</strong> khi bạn thực hiện đăng nhập vào hệ thống Vinacad Portal thông qua phương thức Google Sign-In.
                                </Paragraph>
                            </div>

                            {/* Mục 2 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <CloudLightning size={20} style={{ color: "#1677ff" }} /> 2. Quyền truy cập Google Drive
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Nếu bạn chủ động lựa chọn liên kết tài khoản Google Drive, ứng dụng sẽ tiếp cận các tệp tin và thư mục do bạn <strong>chỉ định một cách rõ ràng</strong>. Quyền này phục vụ hoàn toàn cho các tính năng: duyệt tệp, tải lên, tải về, tổ chức và quản trị dữ liệu kỹ thuật trực tiếp trên nền tảng.
                                </Paragraph>
                            </div>

                            {/* Mục 3 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <Shield size={20} style={{ color: "#1677ff" }} /> 3. Cách thức sử dụng thông tin
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Dữ liệu thu thập được cam kết chỉ sử dụng cho các mục đích sau:
                                </Paragraph>
                                <List
                                    dataSource={usages}
                                    renderItem={(item) => (
                                        <List.Item style={{ padding: "6px 0", border: "none", fontSize: "15px", color: "#4b5563" }}>
                                            <span style={{ color: "#1677ff", marginRight: "10px" }}>•</span> {item}
                                        </List.Item>
                                    )}
                                />
                            </div>

                            {/* Mục 4 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <Share2 size={20} style={{ color: "#1677ff" }} /> 4. Chia sẻ dữ liệu
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Vinacad Portal <strong>không bán, trao đổi hoặc thương mại hóa</strong> thông tin cá nhân của người dùng dưới bất kỳ hình thức nào. Thông tin chỉ được xử lý nội bộ nhằm cung cấp dịch vụ được yêu cầu hoặc chia sẻ hạn chế với đối tác hạ tầng thiết yếu khi có sự đồng ý của bạn để vận hành hệ thống.
                                </Paragraph>
                            </div>

                            {/* Mục 5 */}
                            <div style={{ marginBottom: "36px" }}>
                                <Title level={3} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1f2937", fontWeight: 700 }}>
                                    <ShieldCheck size={20} style={{ color: "#1677ff" }} /> 5. An toàn và bảo mật dữ liệu
                                </Title>
                                <Paragraph style={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.7 }}>
                                    Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp chặt chẽ theo tiêu chuẩn doanh nghiệp nhằm bảo vệ dữ liệu người dùng khỏi các nguy cơ truy cập trái phép, tiết lộ, thay đổi hoặc phá hủy thông tin ngoài ý muốn.
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
                                    Thông tin liên hệ giải đáp
                                </Title>
                                <Paragraph style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                                    Mọi thắc mắc hoặc yêu cầu liên quan đến Quyền riêng tư và Chính sách bảo mật dữ liệu, xin vui lòng gửi về:
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
                                        fontWeight: 500
                                    }}
                                >
                                    truong.d.huynh@prima-sol.com
                                </Button>
                            </div>

                        </Typography>
                    </Card>
                </div>
            </Content>

            {/* Footer nhỏ gọn */}
            <Footer style={{ textAlign: "center", backgroundColor: "transparent", color: "#94a3b8", paddingBottom: "40px" }}>
                © {currentYear} Vinacad Portal. All rights reserved.
            </Footer>
        </Layout>
    );
}