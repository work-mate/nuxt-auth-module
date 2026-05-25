const isMainBranch = process.env.GITHUB_REF_NAME === "main";

export default {
  branches: [{ name: "v1", channel: "v1", range: "1.x" }, "main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        parserOpts: {
          headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
          breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!: (.*)$/,
          headerCorrespondence: ["type", "scope", "subject"],
        },
      },
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "docs"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    ["@semantic-release/github", { makeLatest: isMainBranch ? "true" : "false" }],
  ],
};
