<div align="center">

<img src="./docs/assets/main-feed.webp" width="100%" alt="TRIT Main Banner" />

<br/><br/>

<h1>TRIT</h1>

여행을 '찾고–담고–기록하는' 여행 기반 SNS

[🎥 서비스 시연 영상](https://www.youtube.com/watch?v=Y2AJf9LVbQk) &nbsp;|&nbsp; [📄 150만 가상 데이터 기반 1,500 VU 부하 테스트 리포트](./PERFORMANCE_TUNING_PORTFOLIO.md)

</div>

---

<h3>서비스 소개</h3>

TRIT(트릿)은 일상 속 짧은 외출과 여행을 기록하고, 다른 사람들의 경험을 탐색하며 새로운 장소를 발견할 수 있는 라이프로그 기반 여행 서비스입니다.

사용자는 단순한 여행 일정 계획을 넘어서 다른 사용자의 여행 루트를 참고하고, 마음에 드는 일정을 스크랩하거나, 다녀온 장소를 여행 로그로 기록하며 자신만의 취향 기반 여행 아카이브를 만들어갈 수 있습니다.

---

<h3>주요 기능</h3>

<table>
  <tr>
    <td align="center">
      <b>메인 피드</b>
    </td>
    <td align="center">
      <b>검색 페이지</b>
    </td>
  </tr>
  <tr>
    <td>
      <img src="./docs/assets/main-feed.webp" width="500px" alt="메인 피드"/>
    </td>
    <td>
      <img src="./docs/assets/search.webp" width="500px" alt="검색 페이지1"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>AI 여행 플래너</b>
    </td>
    <td align="center">
      <b>로그 작성</b>
    </td>
  </tr>
  <tr>
    <td>
      <img src="./docs/assets/ai-planner-1.webp" width="500px" alt="여행 플래너"/>
    </td>
    <td>
      <img src="./docs/assets/log-write.webp" width="500px" alt="로그 작성"/>
    </td>
  </tr>
</table>

**🔐 로그인 &amp; 사용자 관리**
* JWT 기반 인증
* 사용자 프로필 관리 (닉네임, 프로필 이미지)
* 계획페이지와 마이페이지에서 작성한 로그 / 스크랩 관리

**🔍 검색 페이지**
* 키워드 기반 검색
* 장소, 일정, 로그를 한눈에 파악 가능

**🤖 AI 여행 플래너**
* 계획 생성을 돕는 AI 여행 플래너
* 실시간 장소 추천 및 코스 점검 가능

**🧭 여행 로그 (Trip Log)**
* 방문한 장소를 하나의 여행 기록으로 저장
* 사진, 텍스트 기반 기록 지원

**👥 소셜 기능**
* 다른 사용자의 여행 기록 탐색
* 좋아요 / 친구 추가 / 알림 기능

---

<h3>서비스 아키텍처</h3>

<div align="center">
  <img src="./docs/architecture.svg" width="100%" alt="TRIT System Architecture" />
</div>

---

<h3>기술 스택</h3>

**Backend**

<p>
  <img src="https://img.shields.io/badge/Java_21-007396?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/MyBatis-000000?style=for-the-badge&logoColor=white" />
</p>

**Database &amp; Cache**

<p>
  <img src="https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis_7.4-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Memcached-00D2B4?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Caffeine_Cache-6F4E37?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Elasticsearch_8.13-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" />
</p>

**Frontend**

<p>
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Pinia-FFD859?style=for-the-badge&logoColor=black" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
</p>

**Infra &amp; DevOps**

<p>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" />
</p>

**Testing &amp; Observability**

<p>
  <img src="https://img.shields.io/badge/k6_Load_Test-7D64FF?style=for-the-badge&logo=k6&logoColor=white" />
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  <img src="https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white" />
</p>

**External AI**

<p>
  <img src="https://img.shields.io/badge/OpenAI_GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white" />
</p>

---

<h3>ERD</h3>

<details>
<summary><b>핵심 도메인</b></summary>
<br/>
<img width="777" alt="핵심 도메인 ERD" src="https://github.com/user-attachments/assets/9f9b2a2e-5121-4e0d-ae39-485f41f7e55c" />
</details>

<details>
<summary><b>전체 도메인</b></summary>
<br/>
<img width="800" alt="전체 도메인 ERD" src="https://github.com/user-attachments/assets/c93bc972-d5db-441c-9439-78318d6d556d" />
</details>

---

<h3>스크린샷</h3>

<details>
<summary><b>스크린샷 펼쳐보기</b></summary>
<br/>
<table>
  <tr>
    <td align="center">
      <b>로그인</b>
    </td>
    <td align="center">
      <b>검색 페이지</b>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./docs/assets/login.webp" width="500px" alt="로그인"/>
    </td>
    <td>
      <img src="./docs/assets/search.webp" width="500px" alt="검색 페이지1"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>메인 피드</b>
    </td>
    <td align="center">
      <b>피드 상세 / 여행 스크랩</b>
    </td>
  </tr>
  <tr>
    <td>
      <img src="./docs/assets/main-feed.webp" width="500px" alt="메인 피드"/>
    </td>
    <td>
      <img src="./docs/assets/scrap.webp" width="500px" alt="여행 스크랩"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>AI와 함께하는 계획 1</b>
    </td>
    <td align="center">
      <b>AI와 함께하는 계획 2</b>
    </td>
  </tr>
  <tr>
    <td>
      <img src="./docs/assets/ai-planner-1.webp" width="500px" alt="여행 계획1"/>
    </td>
    <td>
      <img src="./docs/assets/ai-planner-2.webp" width="500px" alt="여행 계획2"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>로그 작성</b>
    </td>
    <td align="center">
      <b>마이 페이지</b>
    </td>
  </tr>
  <tr>
    <td>
      <img src="./docs/assets/log-write.webp" width="500px" alt="로그 작성"/>
    </td>
    <td>
      <img src="./docs/assets/mypage.webp" width="500px" alt="마이 페이지"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <b>알림 / 친구 요청</b>
    </td>
  </tr>
  <tr>
    <td>
      <img src="./docs/assets/notification.webp" width="500px" alt="알림 및 친구 요청"/>
    </td>
  </tr>
</table>
</details>

---

<h3>로컬 실행 가이드</h3>

* **1. 인프라 컨테이너 실행 (Docker Compose)**
```bash
cd backend
docker compose up -d
```

* **2. 백엔드 애플리케이션 실행**
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

* **3. 프론트엔드 애플리케이션 실행**
```bash
cd frontend
npm install
npm run dev
```

---

<h3>팀원</h3>

<div align="center">

| <img src="https://avatars.githubusercontent.com/u/67683170?v=4" width="120px"> | <img src="https://avatars.githubusercontent.com/u/73033695?v=4" width="120px"> | <img src="https://avatars.githubusercontent.com/u/52701529?v=4" width="120px"> |
|:--:|:--:|:--:|
| **FE 전은진** | **FE / BE 최진우** | **FE / BE 오지현** |
| [GitHub](https://github.com/jeoneunjin) | [GitHub](https://github.com/worldclasscitizen) | [GitHub](https://github.com/zhy2on) |

</div>
