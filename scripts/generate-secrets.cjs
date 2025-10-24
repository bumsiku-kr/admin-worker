#!/usr/bin/env node

/**
 * Admin Secret 값 생성 스크립트
 *
 * 사용법:
 *   node scripts/generate-secrets.js
 *
 * 또는 비밀번호를 인자로 전달:
 *   node scripts/generate-secrets.js my-secure-password
 */

const crypto = require("crypto");
const readline = require("readline");

// 색상 코드
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function generateJWTSecret() {
  return crypto.randomBytes(32).toString("base64");
}

function generatePasswordSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

function printSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${"=".repeat(60)}${colors.reset}\n`);
}

function printValue(label, value, isSecret = false) {
  const displayValue = isSecret ? `${value.substring(0, 20)}...` : value;
  console.log(`${colors.yellow}${label}:${colors.reset}`);
  console.log(`${colors.green}${displayValue}${colors.reset}\n`);
}

function printWarning(message) {
  console.log(`${colors.red}⚠️  ${message}${colors.reset}\n`);
}

function printInfo(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}\n`);
}

async function getPasswordInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `${colors.yellow}Admin 비밀번호를 입력하세요 (최소 12자 권장): ${colors.reset}`,
      (answer) => {
        rl.close();
        resolve(answer);
      },
    );
  });
}

async function main() {
  printSection("Cloudflare Workers Admin Secret 생성기");

  printInfo("이 스크립트는 Admin 인증에 필요한 모든 Secret 값을 생성합니다.");

  // 1. JWT_SECRET 생성
  const jwtSecret = generateJWTSecret();
  printValue("1. JWT_SECRET", jwtSecret, true);
  console.log(`   ${colors.dim}전체 값: ${jwtSecret}${colors.reset}\n`);

  // 2. PASSWORD_SALT 생성
  const passwordSalt = generatePasswordSalt();
  printValue("2. PASSWORD_SALT", passwordSalt);

  // 3. ADMIN_USERNAME
  const adminUsername = "admin";
  printValue("3. ADMIN_USERNAME", adminUsername);

  // 4. 비밀번호 입력 또는 인자로 받기
  let password = process.argv[2];

  if (!password) {
    password = await getPasswordInput();
  }

  if (!password || password.length < 8) {
    printWarning("비밀번호는 최소 8자 이상이어야 합니다!");
    process.exit(1);
  }

  if (password.length < 12) {
    printWarning("비밀번호가 12자 미만입니다. 보안을 위해 더 긴 비밀번호를 권장합니다.");
  }

  // 5. 비밀번호 해시 생성
  const hashedPassword = hashPassword(password, passwordSalt);
  printValue("4. 입력한 비밀번호 (평문)", password);
  printValue("5. ADMIN_PASSWORD (해시)", hashedPassword, true);
  console.log(`   ${colors.dim}전체 값: ${hashedPassword}${colors.reset}\n`);

  // 요약
  printSection("Wrangler Secret 설정 명령어");

  console.log(`${colors.green}다음 명령어를 실행하여 Secret을 설정하세요:${colors.reset}\n`);

  console.log(`cd /Users/peter_mac/Documents/blog-web/admin-worker\n`);
  console.log(`wrangler secret put JWT_SECRET`);
  console.log(`${colors.dim}# 프롬프트가 나타나면 붙여넣기: ${jwtSecret}${colors.reset}\n`);

  console.log(`wrangler secret put PASSWORD_SALT`);
  console.log(`${colors.dim}# 프롬프트가 나타나면 붙여넣기: ${passwordSalt}${colors.reset}\n`);

  console.log(`wrangler secret put ADMIN_USERNAME`);
  console.log(`${colors.dim}# 프롬프트가 나타나면 붙여넣기: ${adminUsername}${colors.reset}\n`);

  console.log(`wrangler secret put ADMIN_PASSWORD`);
  console.log(`${colors.dim}# 프롬프트가 나타나면 붙여넣기: ${hashedPassword}${colors.reset}\n`);

  // 백업 템플릿
  printSection("백업용 값 (안전한 곳에 보관하세요!)");

  const backupTemplate = `
# ===== JWT & 인증 설정 값 =====
# 생성 날짜: ${new Date().toISOString()}

JWT_SECRET=${jwtSecret}
PASSWORD_SALT=${passwordSalt}
ADMIN_USERNAME=${adminUsername}
ACTUAL_PASSWORD=${password}
ADMIN_PASSWORD=${hashedPassword}

# ===== Wrangler Secret 설정 명령어 =====
# wrangler secret put JWT_SECRET
# wrangler secret put PASSWORD_SALT
# wrangler secret put ADMIN_USERNAME
# wrangler secret put ADMIN_PASSWORD
`;

  console.log(backupTemplate);

  printWarning("이 값들을 안전한 비밀번호 관리자에 저장하세요!");
  printInfo("설정이 완료되면 이 터미널 기록을 삭제하는 것을 권장합니다.");

  // 검증 섹션
  printSection("검증 예제");

  console.log(`${colors.green}로그인 테스트 (Worker 배포 후):${colors.reset}\n`);
  console.log(`curl -X POST https://your-worker-url/login \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{`);
  console.log(`    "username": "${adminUsername}",`);
  console.log(`    "password": "${password}"`);
  console.log(`  }'\n`);

  console.log(`${colors.green}해시 재생성 (검증용):${colors.reset}\n`);
  console.log(`node -e "`);
  console.log(`const crypto = require('crypto');`);
  console.log(`const hash = crypto.createHash('sha256')`);
  console.log(`  .update('${password}' + '${passwordSalt}')`);
  console.log(`  .digest('hex');`);
  console.log(`console.log('Expected:', '${hashedPassword}');`);
  console.log(`console.log('Generated:', hash);`);
  console.log(`console.log('Match:', hash === '${hashedPassword}');`);
  console.log(`"\n`);
}

// 스크립트 실행
main().catch((err) => {
  console.error(`${colors.red}오류:${colors.reset}`, err.message);
  process.exit(1);
});
