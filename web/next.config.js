const { execSync } = require('child_process')

function getGitCommitHash() {
  // 1. 优先使用 Amplify 内置环境变量
  if (process.env.AWS_COMMIT_ID) {
    return process.env.AWS_COMMIT_ID.slice(0, 8)
  }

  // 2. 尝试执行 git 命令
  try {
    return execSync('git rev-parse HEAD').toString().trim().slice(0, 8)
  } catch {
    return 'unknown'
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GIT_COMMIT_HASH: getGitCommitHash(),
  },
}

module.exports = nextConfig
