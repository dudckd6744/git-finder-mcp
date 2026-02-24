# git-finder-mcp

사내 여러 Git 프로젝트에서 코드를 검색해주는 MCP 서버.
Claude Code에 연결하여 자연어로 코드 검색이 가능합니다.

## 설치

```bash
npm install
claude mcp add git-finder -- npx tsx /path/to/git-finder-mcp/src/index.ts
```

끝! 별도의 빌드나 ripgrep 설치가 필요 없습니다.

- `@vscode/ripgrep` 패키지가 ripgrep 바이너리를 자동으로 포함합니다.
- `tsx`가 TypeScript를 직접 실행하므로 빌드 단계가 없습니다.

### 사전 요구사항

- Node.js 18+

### 수동 설정

`.claude.json`에 직접 추가할 수도 있습니다:

```json
{
  "mcpServers": {
    "git-finder": {
      "command": "npx",
      "args": ["tsx", "/path/to/git-finder-mcp/src/index.ts"]
    }
  }
}
```

## 사용법

Claude Code에서 자연어로 사용합니다:

```
# 프로젝트 등록
"이 경로를 payment-service라는 이름으로 등록해줘: /Users/box/work/monorepo/packages/payment"

# 코드 검색
"결제 관련 코드 찾아줘"
"인증 미들웨어 어떤 프로젝트에서 쓰고 있어?"
"공통 유틸 함수 중에 날짜 관련된 거 보여줘"

# 프로젝트 구조 확인
"payment-service 프로젝트 구조 보여줘"
```

## MCP Tools

| Tool | 설명 |
|------|------|
| `add_project` | 로컬 경로의 Git 프로젝트를 등록 |
| `remove_project` | 등록된 프로젝트 제거 |
| `list_projects` | 등록된 프로젝트 목록 + 설명 반환 |
| `search_code` | 키워드로 코드 검색 (ripgrep 사용) |
| `get_file_tree` | 프로젝트 파일/폴더 구조 반환 |
| `read_file` | 특정 파일 내용 읽기 |

## 검색 제외 대상

ripgrep이 `.gitignore`를 자동 반영하며, 추가로 다음을 제외합니다:

- **폴더:** node_modules, dist, build, .git, .next, coverage, __pycache__, .turbo, .cache
- **파일:** *.lock, *.map, *.min.js, *.min.css
- **바이너리:** 이미지, 폰트, 오디오, 비디오 등

## 향후 계획 (Backlog)

현재 버전에서는 보류하고, 필요에 따라 추후 도입할 기능들:

### 1. 벡터 검색 도입

- **도입 조건:** 프로젝트가 30개 이상으로 늘어나거나, grep 기반 검색의 정확도가 부족할 때
- **효과:** "결제"로 검색하면 "payment", "checkout", "billing" 등 의미적으로 관련된 코드까지 자동 검색 (현재는 Claude가 키워드 확장으로 보완)
- **필요 기술:** 임베딩 모델 (OpenAI text-embedding-3-small 등), 벡터 DB (ChromaDB 등)
- **고려사항:** 코드 인덱싱 시 임베딩 API 비용 발생, 코드 청크 분할 전략 (함수/클래스 단위) 필요

### 2. npm 패키지 배포

- **도입 조건:** 팀원들이 이 MCP를 자주 사용할 때
- **효과:** `npx -y git-finder-mcp` 한 줄로 사용 가능. 로컬 clone / npm install 불필요
- **필요 작업:** `dist/` 빌드 후 npm publish, `bin` 필드 추가, tsx를 devDependency로 전환

### 3. Git URL로 프로젝트 추가

- **도입 조건:** 로컬에 clone 없는 프로젝트도 등록하고 싶을 때
- **기능:** add_project에 url 파라미터 추가. MCP 서버가 자동 clone/pull 수행
- **고려사항:** private repo 인증 (SSH key / Personal Access Token), clone 저장 경로 관리, 자동 최신화 주기 설정
