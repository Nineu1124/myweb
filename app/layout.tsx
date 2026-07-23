import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: "MONUMENTS OF ECHOES / 回响纪念碑",
      template: "%s · MONUMENTS OF ECHOES",
    },
    description:
      "一座在人类消失后仍在运行的个人档案遗迹。恢复通信、思想、记忆、创造与身份。",
    applicationName: "MONUMENTS OF ECHOES",
    keywords: ["互动叙事", "个人网站", "数字档案", "作品集", "回响纪念碑"],
    openGraph: {
      title: "MONUMENTS OF ECHOES / 回响纪念碑",
      description:
        "世界已经失联，记录仍在运行。进入一座仍在书写的个人档案遗迹。",
      type: "website",
      locale: "zh_CN",
      url: metadataBase,
      images: [
        {
          url: socialImage,
          width: 1672,
          height: 941,
          alt: "MONUMENTS OF ECHOES / 回响纪念碑",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "MONUMENTS OF ECHOES / 回响纪念碑",
      description:
        "世界已经失联，记录仍在运行。进入一座仍在书写的个人档案遗迹。",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
