import React from "react";

export default function TermsOfUse() {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                padding: "40px 20px",
            }}
        >
            <div
                style={{
                    maxWidth: 900,
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: 20,
                    padding: 40,
                    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                }}
            >
                <div style={{ marginBottom: 30 }}>
                    <span
                        style={{
                            background: "#eef2ff",
                            color: "#4f46e5",
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        LEGAL
                    </span>

                    <h1
                        style={{
                            marginTop: 20,
                            fontSize: 42,
                            fontWeight: 700,
                            color: "#111827",
                        }}
                    >
                        Terms of Use
                    </h1>

                    <p style={{ color: "#6b7280" }}>
                        Last updated: June 2026
                    </p>
                </div>

                <section style={{ marginBottom: 30 }}>
                    <h2>Acceptance of Terms</h2>
                    <p>
                        By accessing or using the application, you agree to be
                        bound by these Terms of Use.
                    </p>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>Google Drive Features</h2>
                    <p>
                        The application may allow users to browse, upload,
                        download, organize, move, rename, and manage files and
                        folders stored in Google Drive.
                    </p>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>Permitted Use</h2>
                    <ul>
                        <li>No unauthorized access attempts.</li>
                        <li>No malicious software uploads.</li>
                        <li>No abuse of platform resources.</li>
                        <li>No violation of intellectual property rights.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>User Responsibility</h2>
                    <p>
                        Users are responsible for maintaining the security of
                        their accounts and for all activities performed under
                        their accounts.
                    </p>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>Limitation of Liability</h2>
                    <p>
                        The application is provided on an "AS IS" basis without
                        warranties of any kind. We are not liable for any loss
                        resulting from the use of the service.
                    </p>
                </section>

                <section>
                    <h2>Contact</h2>
                    <p>truong.d.huynh@prima-sol.com</p>
                </section>
            </div>
        </div>
    );
}
