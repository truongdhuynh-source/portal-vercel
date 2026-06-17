import React from "react";

export default function PrivacyPolicy() {
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
                            background: "#ecfeff",
                            color: "#0891b2",
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
                        Privacy Policy
                    </h1>

                    <p style={{ color: "#6b7280" }}>
                        Last updated: June 2026
                    </p>
                </div>

                <section style={{ marginBottom: 30 }}>
                    <h2>Information We Collect</h2>
                    <p>
                        We may collect your Google account profile information,
                        including your name, email address, and profile picture,
                        when you sign in using Google.
                    </p>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>Google Drive Access</h2>
                    <p>
                        If you choose to connect your Google Drive account, the
                        application may access files and folders that you
                        explicitly authorize in order to provide file browsing,
                        upload, download, organization, and management features.
                    </p>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>How We Use Information</h2>
                    <ul>
                        <li>Authenticate users.</li>
                        <li>Provide file management features.</li>
                        <li>Improve application functionality.</li>
                        <li>Maintain system security and reliability.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>Data Sharing</h2>
                    <p>
                        We do not sell personal information. Information is only
                        used to provide requested services and may be shared with
                        service providers when necessary to operate the platform.
                    </p>
                </section>

                <section style={{ marginBottom: 30 }}>
                    <h2>Data Security</h2>
                    <p>
                        We implement reasonable technical and organizational
                        measures to protect user data against unauthorized access,
                        disclosure, alteration, or destruction.
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
