import React from "react";
import { Layout, Button, Row, Col, Card, Space, Divider } from "antd";
import {
    Layers,
    FileText,
    Users,
    ShieldCheck,
    Mail,
    ExternalLink
} from "lucide-react";

const { Header, Content, Footer } = Layout;

export default function HomePage() {
    const currentYear = new Date().getFullYear();

    // Dữ liệu danh sách tính năng để map ra Card
    const features = [
        {
            icon: <Layers size={28} style={{ color: "#1677ff" }} />,
            title: "Trực quan hóa 3D",
            desc: "Xem và tương tác trực tiếp với các mô hình CAD 3D ngay trên trình duyệt web, mượt mà và trực quan.",
        },
        {
            icon: <FileText size={28} style={{ color: "#52c41a" }} />,
            title: "Quản lý Tài liệu Hồ sơ",
            desc: "Hệ thống lưu trữ bản vẽ kỹ thuật thông minh, phân loại khoa học và hỗ trợ kiểm soát phiên bản chính xác.",
        },
        {
            icon: <Users size={28} style={{ color: "#13c2c2" }} />,
            title: "Hợp tác Dự án",
            desc: "Kết nối các phòng ban, kỹ sư và đối tác cùng duyệt thiết kế, ghi chú phản hồi theo thời gian thực.",
        },
        {
            icon: <ShieldCheck size={28} style={{ color: "#722ed1" }} />,
            title: "Bảo mật Tuyệt đối",
            desc: "Cơ chế phân quyền truy cập nghiêm ngặt, mã hóa dữ liệu, bảo vệ tối đa tài sản trí tuệ doanh nghiệp.",
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            {/* 1. THANH ĐIỀU HƯỚNG (NAVBAR) */}
            <Header
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "between",
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(8px)",
                    borderBottom: "1px solid #f0f0f0",
                    padding: "0 24px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            backgroundColor: "#1677ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "16px"
                        }}>
                            V
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "#001529", letterSpacing: "-0.5px" }}>
                            Vinacad Portal
                        </span>
                    </div>

                    {/* Menu phụ & Nút hành động */}
                    <Space size="middle">
                        <Button type="primary" size="middle" style={{ borderRadius: "6px", fontWeight: 500 }}>
                            Truy cập Hệ thống
                        </Button>
                    </Space>
                </div>
            </Header>

            {/* 2. KHU VỰC TRỌNG TÂM (HERO SECTION) */}
            <Content style={{ padding: "0" }}>
                <div style={{
                    padding: "100px 24px 80px 24px",
                    textAlign: "center",
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
                }}>
                    <div style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        backgroundColor: "#e6f4ff",
                        color: "#0958d9",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "24px"
                    }}>
                        ⚙️ Enterprise CAD Platform
                    </div>

                    <h1 style={{
                        fontSize: "clamp(32px, 5vw, 48px)",
                        fontWeight: 800,
                        color: "#1f2937",
                        lineHeight: 1.2,
                        maxWidth: "800px",
                        margin: "0 auto 20px auto",
                        letterSpacing: "-1px"
                    }}>
                        Quản lý Dữ liệu CAD & Tối ưu hóa <span style={{ color: "#1677ff" }}>Hợp tác Kỹ thuật</span>
                    </h1>

                    <p style={{
                        fontSize: "18px",
                        color: "#64748b",
                        maxWidth: "640px",
                        margin: "0 auto 40px auto",
                        lineHeight: 1.6
                    }}>
                        Nền tảng chuyên nghiệp hỗ trợ quản lý dữ liệu sản phẩm, trực quan hóa mô hình 3D và kết nối đội ngũ kỹ sư vận hành hiệu quả.
                    </p>

                    <Space size="md">
                        <Button type="primary" size="large" style={{ height: "48px", padding: "0 32px", borderRadius: "8px", fontWeight: 600 }}>
                            Khám phá ngay
                        </Button>
                        <Button size="large" href="mailto:truong.d.huynh@prima-sol.com" style={{ height: "48px", padding: "0 24px", borderRadius: "8px", fontWeight: 500, margin: 8 }}>
                            Yêu cầu Demo
                        </Button>
                    </Space>
                </div>

                {/* 3. DANH SÁCH TÍNH NĂNG (FEATURES SECTION) */}
                <div style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#1f2937", marginBottom: "12px" }}>
                            Tính năng cốt lõi
                        </h2>
                        <p style={{ color: "#64748b", fontSize: "16px" }}>
                            Giải pháp toàn diện đáp ứng các tiêu chuẩn kỹ thuật khắt khe của doanh nghiệp
                        </p>
                    </div>

                    <Row gút={[24, 24]} gutter={[24, 24]}>
                        {features.map((item, index) => (
                            <Col xs={24} sm={12} lg={6} key={index}>
                                <Card
                                    hoverable
                                    bordered={false}
                                    style={{
                                        height: "100%",
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                                    }}
                                    bodyStyle={{ padding: "32px 24px" }}
                                >
                                    <div style={{ marginBottom: "20px" }}>{item.icon}</div>
                                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "10px" }}>
                                        {item.title}
                                    </h3>
                                    <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
                                        {item.desc}
                                    </p>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* 4. GIỚI THIỆU (ABOUT SECTION) */}
                <div style={{ backgroundColor: "#ffffff", padding: "80px 24px", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", marginBottom: "20px" }}>
                            Về Vinacad Portal
                        </h2>
                        <p style={{ fontSize: "16px", color: "#4b5563", lineHeight: 1.7, margin: 0 }}>
                            Vinacad Portal được xây dựng nhằm tối ưu hóa vòng đời phát triển sản phẩm. Bằng cách tập trung dữ liệu
                            CAD vào một nền tảng web duy nhất, hệ thống giúp loại bỏ rào cản về phần cứng chuyên dụng, cho phép
                            mọi thành viên trong dự án dễ dàng kiểm tra thiết kế, chia sẻ dữ liệu và cộng tác an toàn, bảo mật.
                        </p>
                    </div>
                </div>

                {/* 5. LIÊN HỆ (CONTACT SECTION) */}
                <div style={{
                    padding: "80px 24px",
                    textAlign: "center",
                    background: "linear-gradient(135deg, #001529 0%, #002140 100%)",
                    color: "#ffffff"
                }}>
                    <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", marginBottom: "12px" }}>
                        Bắt đầu tối ưu quy trình của bạn
                    </h2>
                    <p style={{ color: "#a3b3c4", fontSize: "16px", maxWidth: "500px", margin: "0 auto 32px auto" }}>
                        Liên hệ ngay để nhận tài khoản thử nghiệm cũng như tư vấn kiến trúc hệ thống phù hợp.
                    </p>
                    <Button
                        type="primary"
                        size="large"
                        icon={<Mail size={16} />}
                        href="mailto:truong.d.huynh@prima-sol.com"
                        style={{
                            height: "48px",
                            padding: "0 28px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            backgroundColor: "#1677ff",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        truong.d.huynh@prima-sol.com
                    </Button>
                </div>
            </Content>

            {/* 6. CHÂN TRANG (FOOTER) */}
            <Footer style={{ backgroundColor: "#000810", padding: "32px 24px", color: "#8c8c8c" }}>
                <div style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px"
                }}>
                    <div style={{ fontSize: "14px" }}>
                        © {currentYear} Vinacad Portal. Developed by Prima Sol.
                    </div>

                    <Space split={<Divider type="vertical" style={{ borderColor: "#303030" }} />}>
                        <a href="/privacy-policy" style={{ color: "#8c8c8c", transition: "color 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#8c8c8c"}>
                            Chính sách bảo mật
                        </a>
                        <a href="/terms-of-use" style={{ color: "#8c8c8c", transition: "color 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#8c8c8c"}>
                            Điều khoản sử dụng
                        </a>
                    </Space>
                </div>
            </Footer>
        </Layout>
    );
}