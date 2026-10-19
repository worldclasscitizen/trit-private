# TRIT 피드 시스템 부하 테스트 가이드 (k6)

## 개요
이 디렉터리는 k6를 활용하여 피드 시스템의 5대 아키텍처 전략과 핵심 최적화 기법(Write-Behind 좋아요 버퍼링, Redis 청크 파이프라이닝, 복합 다중 시나리오 실전 부하)을 정량적으로 검증하기 위한 부하 테스트 스위트를 포함합니다.

단위 최적화 지표를 노이즈 없이 측정하는 **격리 단독 테스트**와, 프로덕션 자원 경합 상황을 모사하는 **종합 복합 동시 테스트**로 구분되어 구성되어 있습니다.

---

## 5대 피드 아키텍처 전략

1. **단방향 DB Pull (`FEED_TYPE=db`)**: OR 조인 기반 단방향 친구 관계 조회
2. **양방향 최적화 DB Pull (`FEED_TYPE=db-optimized`)**: 양방향 친구 관계 및 단일 복합 인덱스 스캔 조회
3. **순수 Redis Push (`FEED_TYPE=redis`)**: Pipelined ZADD 기반의 모든 친구 타임라인 전송
4. **인플루언서 하이브리드 (`FEED_TYPE=hybrid`)**: 친구 수 5,000명 미만 일반 사용자는 Redis Push, 5,000명 이상 인플루언서는 Redis Pull 격리 후 100개 단위 Redis Pipelining 일괄 조회 및 인메모리 병합
5. **Meta 스타일 하이브리드 + Memcached (`FEED_TYPE=hybrid-memcached`)**: 타임라인 인덱스는 100개 단위 Redis Pipelining 하이브리드(Push+Pull)로 조합하고, 게시물 본문·작성자 프로필·실시간 카운터는 정규화된 Memcached 멀티스레드 캐시(`MGET`) 및 Redis Set 파이프라인으로 조립(Hydration)하여 MySQL 조회 부하를 최소화

---

## 테스트 시나리오 구성

| 스크립트 | 유형 | 트래픽 구성 및 특징 | 검증 목표 |
| :--- | :--- | :--- | :--- |
| `feed_read_benchmark.js` | 격리 단독 | 무한 스크롤(커서 3회 연속 요청) 순수 읽기 부하 (최대 1,500 VUs) | 5대 피드 전략별 순수 읽기 처리량 및 p95/p99 지연 시간 비교 |
| `feed_mixed_benchmark.js` | 격리 혼합 | 읽기 80% + 새 글 작성 20% 혼합 부하 (최대 1,500 VUs) | 쓰기 시 Fan-out 전파 부하가 피드 읽기 지연에 미치는 영향 검증 |
| `like_burst_benchmark.js` | 격리 단독 | 핫 게시물 1~5개 대상 좋아요/취소 연타 쓰기 폭주 (최대 1,500 VUs) | PR 10 Write-Behind Redis 버퍼링 및 백그라운드 배치 비동기 동기화 처리량 검증 |
| `influencer_pipeline_benchmark.js` | 격리 단독 | 인플루언서 다수 팔로워 피드 조회 (최대 800 VUs) | PR 11 청크(100개) 파이프라이닝을 통한 타임라인 병합 RTT 단축 및 지연 시간 검증 |
| `feed_realistic_mixed_benchmark.js` | 종합 복합 | k6 다중 시나리오: 피드 70% + 좋아요 15% + 댓글 10% + 글작성 4% + 헤비 팔로워 1% (총 1,500 VUs) | Redis 이벤트 루프, 톰캣 스레드, HikariCP 커넥션 경합 환경에서의 시스템 실전 한계치 검증 |

---

## 실행 방법

### 1. 5대 피드 전략 순수 읽기 벤치마크 (`feed_read_benchmark.js`)

**k6 로컬 CLI 실행**
```bash
k6 run -e FEED_TYPE=db load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=db-optimized load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=redis load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=hybrid load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=hybrid-memcached load-tests/feed_read_benchmark.js
```

**Docker 실행**
```bash
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=hybrid-memcached - < load-tests/feed_read_benchmark.js
```

### 2. Write-Behind 좋아요 연타 폭주 벤치마크 (`like_burst_benchmark.js`)

**k6 로컬 CLI 실행**
```bash
k6 run -e TARGET_LOG_ID=1 load-tests/like_burst_benchmark.js
```

**Docker 실행**
```bash
docker run --rm -i --net="host" grafana/k6 run -e TARGET_LOG_ID=1 - < load-tests/like_burst_benchmark.js
```

### 3. 인플루언서 청크 파이프라이닝 피드 벤치마크 (`influencer_pipeline_benchmark.js`)

**k6 로컬 CLI 실행**
```bash
k6 run -e FEED_TYPE=hybrid-memcached -e USER_EMAIL=normal_user_2@trit.com load-tests/influencer_pipeline_benchmark.js
k6 run -e FEED_TYPE=hybrid -e USER_EMAIL=normal_user_2@trit.com load-tests/influencer_pipeline_benchmark.js
```

**Docker 실행**
```bash
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=hybrid-memcached -e USER_EMAIL=normal_user_2@trit.com - < load-tests/influencer_pipeline_benchmark.js
```

### 4. 실전 종합 복합 부하 테스트 (`feed_realistic_mixed_benchmark.js`)

**k6 로컬 CLI 실행**
```bash
k6 run -e FEED_TYPE=hybrid-memcached load-tests/feed_realistic_mixed_benchmark.js
k6 run -e FEED_TYPE=hybrid load-tests/feed_realistic_mixed_benchmark.js
k6 run -e FEED_TYPE=redis load-tests/feed_realistic_mixed_benchmark.js
```

**Docker 실행**
```bash
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=hybrid-memcached - < load-tests/feed_realistic_mixed_benchmark.js
```

---

## Grafana 관측 및 핵심 병목 지표

부하 테스트 수행 중 Grafana 대시보드에서 반드시 관측해야 하는 4대 핵심 자원 메트릭입니다.

* **Redis 단일 스레드 이벤트 루프 & CPU 사용률**
  * 메트릭: `container_cpu_usage_seconds_total{name="redis"}`, Redis slowlog
  * 점검 사항: 좋아요 연타와 청크 파이프라인 동시 인입 시 Redis CPU 코어가 100%에 도달하여 Head-of-Line Blocking이 일어나는지 관측

* **Tomcat 워커 스레드 풀 점유율**
  * 메트릭: `tomcat_threads_busy_threads{name="http-nio-8080"}`, `tomcat_threads_current_threads{name="http-nio-8080"}`
  * 점검 사항: 헤비 팔로워 피드 조합 지연 시 톰캣 200개 스레드가 고갈되어 일반 요청 큐잉 지연이 발생하는지 확인

* **HikariCP 커넥션 풀 경합**
  * 메트릭: `hikaricp_connections_active`, `hikaricp_connections_pending`
  * 점검 사항: 3초 주기 Write-Behind 스케줄러의 벌크 INSERT/DELETE 실행 및 캐시 미스 Fallback 시 10개 커넥션 대기열 발생 여부 확인

* **Memcached 멀티스레드 캐시 적중률**
  * 메트릭: `memcached_commands_total{status="hit"}`, `memcached_commands_total{status="miss"}`
  * 점검 사항: 2-Pass MGET 하이드레이션 파이프라인의 캐시 적중률 및 MySQL 엔티티 조회 쿼리 방어율 확인

---

## 벤치마크 결과 종합 정리 템플릿

| 평가 지표 | 단방향 DB (`db`) | 양방향 DB (`db-optimized`) | 순수 Redis (`redis`) | 인플루언서 하이브리드 (`hybrid`) | Meta 하이브리드+Memcached (`hybrid-memcached`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 최대 처리량 (RPS / TPS) | **178.14 req/s** | **176.15 req/s** | **185.46 req/s** | 측정값 req/s | 측정값 req/s |
| 평균 응답 시간 (Avg Latency) | **29.50 ms** | **23.75 ms** (-19.5%) | **17.38 ms** (-41.1%) | 측정값 ms | 측정값 ms |
| 상위 90% 응답 시간 (p90) | **30.98 ms** | **24.92 ms** (-19.6%) | **19.99 ms** (-35.5%) | 측정값 ms | 측정값 ms |
| 상위 95% 응답 시간 (p95) | **58.35 ms** | **34.69 ms** (-40.5%) | **25.87 ms** (-55.7%) | 측정값 ms | 측정값 ms |
| 최대 응답 시간 (Max Latency) | **513.12 ms** | **492.24 ms** | **379.31 ms** (-26.1%) | 측정값 ms | 측정값 ms |
| 에러율 (HTTP 5xx / Fail Rate) | **0.00% (0 / 45,694)** | **0.00% (2건 소켓 오류 / 45,663)** | **0.00% (0 / 45,616)** | % | % |
| 사용자 체감 루프 완료 시간 (`iteration`) | **15.56초** | **15.57초** | **5.01초 (-67.8%)** | 측정값 s | 측정값 s |
| 총 완료 루프 횟수 (`iterations`) | **15,231 회** | **15,222 회** | **45,615 회 (+199.5%)** | 회 | 회 |
| 1,500 VUs 동시성 검증 | **성공 (Checks 100%)** | **성공 (Checks 99.99%)** | **성공 (Checks 100%)** | | |
