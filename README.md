<div align="center">

<img src="https://github.com/user-attachments/assets/83909b19-0012-4fc4-877a-0d2e67dd78b0" width="100%" style="max-width: 820px; border-radius: 14px;" alt="TRIT Main Banner" />

<br/><br/>

**TRIT (트릿) - Travel Life-Log SNS &amp; Scalability Engineering Lab**

일상 속 짧은 외출과 여행을 기록하고 취향 기반 여행 아카이브를 탐색하는 소셜 플랫폼

[🎥 서비스 시연 영상 보러가기](https://www.youtube.com/watch?v=Y2AJf9LVbQk) &nbsp;|&nbsp; [📄 150만 대규모 성능 튜닝 상세 리포트 보러가기](./PERFORMANCE_TUNING_PORTFOLIO.md)

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Java_21-007396?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis_7.4-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Memcached-00D2B4?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Elasticsearch_8.13-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/k6_Load_Test-7D64FF?style=for-the-badge&logo=k6&logoColor=white" />
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

</div>

---

**1. 프로젝트 소개**

* **서비스 개요**
  * **TRIT(트릿)** 은 단순한 여행 계획 작성을 넘어, 다른 사용자의 여행 루트를 탐색하고 마음에 드는 일정을 스크랩하며 나만의 여행 기록을 남기는 **라이프로그 기반 여행 소셜 서비스**입니다.

* **개인 엔지니어링 랩 (Performance &amp; Scalability Lab)**
  * 본 저장소는 팀 프로젝트의 비즈니스 로직을 기반으로, **150만 더미 회원 규모 환경에서 발생하는 데이터베이스 병목, 대규모 피드 팬아웃(Push vs Pull), 좋아요 쓰기 폭주를 해결하기 위해 최진우가 단독으로 심화 성능 튜닝 및 아키텍처 진화를 수행한 개인 연구/최적화 공간**입니다.

---

**2. 핵심 성능 튜닝 하이라이트 (Engineering Achievements)**

1,500 VUs(동시 가상 사용자) 고부하 환경에서 단계별 병목을 규명하고 달성한 핵심 최적화 성과입니다:

| 최적화 영역 | 기존 병목 상태 (Baseline) | 최적화 후 실측치 (Tuned) | 개선 성과 | 핵심 적용 기법 |
|---|---|---|---|---|
| **실전 복합 피드 응답 지연 (p95)** | **5.49s** (DB 커넥션 고갈) | **255.1ms** (정상 응답 202ms) | **95.4% 단축** | Caffeine L1 인메모리 캐시 도입 (피드 스크롤 2.4만 번 DB 쿼리 완전 격리) |
| **좋아요 연타 쓰기 폭주** | 1,297 RPS (p95 876ms) | **2,521.6 RPS (p95 38.9ms)** | **처리량 1.94배 증가** | Write-Behind 비동기 큐 + Fast-Path 유효성 검증 + 불변 JWT 서명 캐싱 |
| **피드 본문 수화 (Hydration)** | p95 162.0ms (MySQL I/O) | **p95 76.0ms** | **53.1% 단축** | Redis ZSet(타임라인 ID 정렬) + Memcached(멀티스레드 본문 수화) 분리 |
| **DB 커넥션 획득 대기열** | 평균 1.87s (최대 11.99s) | **0.65ms (대기열 0개)** | **99.9% 지연 제거** | HikariCP 풀 50 확장 및 인플루언서 친구 조회 캐싱 |

*상세한 튜닝 서사, 아키텍처 트레이드오프 분석 및 실측 데이터는 [📄 PERFORMANCE_TUNING_PORTFOLIO.md](./PERFORMANCE_TUNING_PORTFOLIO.md)에서 확인하실 수 있습니다.*

---

**3. 시스템 아키텍처 (System Architecture)**

<div align="center">
  <img src="./docs/architecture.svg" width="100%" style="max-width: 950px; border-radius: 12px;" alt="TRIT High-Performance Architecture Diagram" />
</div>

* **Client Tier**
  * **Web Client**: Vue 3 + TypeScript + Vite 기반의 반응형 SPA.
  * **k6 Load Generator**: 1,500 VUs 실전 복합 시나리오(읽기, 쓰기, 좋아요, 댓글) 부하 주입.

* **Spring Boot Application Tier (Java 21 / Spring Boot 3.5)**
  * **Security &amp; Auth**: Spring Security 6 무상태 JWT 인증 + 서명 검증 CPU 부하를 방어하는 60초 로컬 토큰 캐시.
  * **Local In-Memory Cache (Caffeine)**: 피드 스크롤 시 MySQL 커넥션을 독점하던 인플루언서 조회를 O(1) 메모리 참조로 격리 (Window TinyLFU, TTL 5분, 최대 10,000건 제한, 친구 추가/삭제 시 실시간 무효화).
  * **Connection &amp; Thread Management**: 톰캣 최대 스레드 500개 + HikariCP 커넥션 풀 50개 용량 산정.

* **Docker Container Network Tier (Containerized Infrastructure)**
  * **Redis 7.4 (🐳 DOCKER)**: 팔로워 5,000명 미만 일반 친구 타임라인(ZSet Push) 및 초당 수천 건 좋아요 연타를 흡수하는 Write-Behind 버퍼.
  * **Memcached (🐳 DOCKER)**: XMemcached 바이너리 프로토콜 기반의 멀티스레드 게시글 본문(Entity) 수화 전용 캐시.
  * **MySQL 8.0 (🐳 DOCKER)**: 150만 회원 및 수백만 여행 로그 영속 스토리지, 커버링 복합 인덱스 및 No-Offset 커서 기반 페이징 적용.
  * **Elasticsearch 8.13 (🐳 DOCKER)**: N-gram 형태소 분석기를 적용한 여행 일정 및 관광지 자동완성 전문 검색 엔진.
  * **Prometheus &amp; Grafana (🐳 DOCKER)**: 5초 주기로 Spring Actuator OpenMetrics를 수집하는 실시간 커넥션/JVM 모니터링 파이프라인.

* **External Services**
  * **OpenAI API**: GPT-4o-mini 기반의 대화형 맞춤 여행 코스 추천 플래너.
  * **AWS S3**: 여행 사진 및 프로필 미디어 스토리지.

---

**4. 기술 스택 (Tech Stacks)**

* **Backend &amp; Core**
  * Java 21 LTS, Spring Boot 3.5.8, Spring Security 6, JJWT 0.11.5, MyBatis 3.0.5, HikariCP 6.3.3, Caffeine Cache 3.2.3

* **Data &amp; Caching**
  * MySQL 8.0, Redis 7.4, Memcached (XMemcached), Elasticsearch 8.13

* **Frontend**
  * Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios

* **Testing &amp; Observability**
  * Grafana k6, Prometheus, Grafana, Spring Boot Actuator, Docker, Docker Compose

* **DevOps &amp; Collaboration**
  * Git, GitHub, IntelliJ IDEA, VS Code, Notion

---

**5. 주요 기능 및 화면 구성**

모든 이미지는 좌우 스크롤 없이 한눈에 볼 수 있도록 반응형 2열 레이아웃으로 구성되었습니다:

<table width="100%">
  <tr>
    <td width="50%" align="center"><b>메인 피드 (하이브리드 캐싱 적용)</b></td>
    <td width="50%" align="center"><b>여행 코스 상세 및 스크랩</b></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/83909b19-0012-4fc4-877a-0d2e67dd78b0" width="100%" style="border-radius: 8px;" alt="메인 피드" />
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/05cfabf4-5a8f-4346-931c-577da0ca236b" width="100%" style="border-radius: 8px;" alt="피드 상세 스크랩" />
    </td>
  </tr>
  <tr>
    <td>
      * 일반 친구 글은 Redis ZSet 타임라인에서 O(1) 즉시 수신<br/>
      * 팔로워 5,000명 이상 인플루언서 글은 실시간 메모리 병합<br/>
      * Memcached 멀티스레드 엔티티 수화로 p95 76ms 달성
    </td>
    <td>
      * 다른 사용자가 다녀온 여행 코스 및 일정 열람<br/>
      * 마음에 드는 여행 일정을 내 보관함으로 원클릭 스크랩<br/>
      * 지도 기반의 상세 동선 시각화
    </td>
  </tr>

  <tr>
    <td width="50%" align="center"><b>AI 맞춤 여행 플래너</b></td>
    <td width="50%" align="center"><b>여행 일정 동선 생성 및 편집</b></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/a41919c1-8765-4f85-8846-69a767e27cc5" width="100%" style="border-radius: 8px;" alt="AI 여행 플래너" />
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/2baef092-9116-428b-b6b5-4619142c4423" width="100%" style="border-radius: 8px;" alt="여행 계획 편집" />
    </td>
  </tr>
  <tr>
    <td>
      * OpenAI GPT-4o-mini 연동 대화형 여행 추천<br/>
      * 여행 테마, 기간, 예산에 맞춘 최적의 관광지 자동 제안<br/>
      * 실시간 코스 검증 및 피드백 반영
    </td>
    <td>
      * 일자별 방문지(Spot) 추가, 삭제 및 순서 변경<br/>
      * Google Maps API 연동 이동 거리 및 경로 시각화<br/>
      * 일차별 메모 및 실시간 코스 수정 기능
    </td>
  </tr>

  <tr>
    <td width="50%" align="center"><b>관광지 및 여행기 검색 (Elasticsearch)</b></td>
    <td width="50%" align="center"><b>여행 로그 작성</b></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/6a72d2e7-3def-4157-afda-302e9de899e3" width="100%" style="border-radius: 8px;" alt="검색 페이지" />
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/48e72e95-a392-4532-abec-93cfc499dd73" width="100%" style="border-radius: 8px;" alt="로그 작성" />
    </td>
  </tr>
  <tr>
    <td>
      * Elasticsearch 8.13 기반 실시간 전문 검색(Full-Text Search)<br/>
      * N-gram 역색인 기반 오타 보정 및 키워드 자동완성<br/>
      * 장소, 일정, 사용자 여행기를 통합 필터링 탐색
    </td>
    <td>
      * 다녀온 여행 일정에 사진과 텍스트 기록 결합<br/>
      * AWS S3 기반 멀티파트 이미지 업로드<br/>
      * 공개 범위 설정 (전체 공개 / 친구 공개 / 비공개)
    </td>
  </tr>

  <tr>
    <td width="50%" align="center"><b>마이페이지 및 프로필 관리</b></td>
    <td width="50%" align="center"><b>실시간 알림 및 친구 요청</b></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/f07d0206-418d-4d27-8bb6-67708c33265d" width="100%" style="border-radius: 8px;" alt="마이 페이지" />
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/d24c24f7-b39d-4249-8eba-855599cc9d9a" width="100%" style="border-radius: 8px;" alt="알림 및 친구 요청" />
    </td>
  </tr>
  <tr>
    <td>
      * 작성한 여행 로그 및 스크랩한 코스 모아보기<br/>
      * 프로필 정보 및 닉네임, 프로필 사진 변경<br/>
      * 내 친구 목록 및 팔로워 현황 조회
    </td>
    <td>
      * 친구 요청, 수락, 게시글 좋아요 알림 실시간 확인<br/>
      * 친구 관계 변경 시 Caffeine 로컬 캐시 즉시 무효화<br/>
      * 알림 읽음 처리 및 관련 페이지 다이렉트 라우팅
    </td>
  </tr>
</table>

---

**6. 로컬 실행 가이드 (Quick Start)**

* **1) 사전 요구사항**
  * Java 21 LTS
  * Node.js 20+
  * Docker &amp; Docker Compose

* **2) 인프라 컨테이너 실행 (Docker Compose)**
```bash
cd backend
docker compose up -d
```
*MySQL(3307), Redis(6379), Memcached(21211), Elasticsearch(9200), Prometheus(9090), Grafana(3000)가 기동됩니다.*

* **3) 백엔드 애플리케이션 실행**
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

* **4) 프론트엔드 애플리케이션 실행**
```bash
cd frontend
npm install
npm run dev
```

* **5) 1,500 VUs 부하 테스트 실행 (k6)**
```bash
cd load-tests
./k6 run --env FEED_TYPE=hybrid-memcached feed_realistic_mixed_benchmark.js
```

---

**7. 팀원 소개 (Contributors)**

<div align="center">
<table width="100%">
  <tr>
    <td width="33.3%" align="center">
      <img src="https://avatars.githubusercontent.com/u/67683170?v=4" width="110px" style="border-radius: 50%;" alt="전은진" /><br/>
      <b>전은진</b><br/>
      Frontend Engineer<br/>
      <a href="https://github.com/jeoneunjin">@jeoneunjin</a>
    </td>
    <td width="33.3%" align="center">
      <img src="https://avatars.githubusercontent.com/u/73033695?v=4" width="110px" style="border-radius: 50%;" alt="최진우" /><br/>
      <b>최진우</b><br/>
      Backend &amp; Scalability Lead<br/>
      <a href="https://github.com/worldclasscitizen">@worldclasscitizen</a>
    </td>
    <td width="33.3%" align="center">
      <img src="https://avatars.githubusercontent.com/u/52701529?v=4" width="110px" style="border-radius: 50%;" alt="오지현" /><br/>
      <b>오지현</b><br/>
      Frontend &amp; Backend Engineer<br/>
      <a href="https://github.com/zhy2on">@zhy2on</a>
    </td>
  </tr>
</table>
</div>
