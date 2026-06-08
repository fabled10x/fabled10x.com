import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  turbopack: {
    // The force-dynamic /build-log routes read *live* operational state at
    // request time — pipeline/active/*.yaml plus git-worktree files whose paths
    // come from `git worktree list` (see src/lib/build-log/*). Those reads are
    // rooted at a runtime-resolved repo root, so @vercel/nft can't statically
    // scope them and emits "the whole project was traced unintentionally."
    // The behavior is intentional and harmless (we deploy via `next start`, not
    // the standalone bundle), so suppress just this advisory. Scoped by
    // description so genuine config issues still surface.
    ignoreIssue: [
      {
        path: "**/next.config.ts",
        description: /the whole project was traced unintentionally/,
      },
    ],
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
