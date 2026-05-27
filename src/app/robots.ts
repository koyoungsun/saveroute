import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Temporary operational protection before public launch.
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/admin/", "/search", "/search/", "/my-benefits", "/mypage", "/onboarding"],
      },
    ],
  };
}

