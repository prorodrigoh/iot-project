import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "IoT Project",
    description: "IoT Project Frontend",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
