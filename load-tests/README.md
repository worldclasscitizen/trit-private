# TRIT 피드 시스템 부하 테스트 가이드 (k6)

## 개요
이 디렉터리는 k6를 활용하여 피드 시스템의 4대 아키텍처 전략(단방향 DB Pull vs 양방향 DB Pull vs 순수 Redis Push vs 인플루언서 하이브리드)을 동시 다발적 트래픽 환경에서 비교 검증하기 위한 부하 테스트 시나리오를 포함합니다.

## 4대 피드 아키텍처 전략
1. 단방향 DB Pull (`FEED_TYPE=db`): OR 조인 기반 단방향 친구 관계 조회
2. 양방향 최적화 DB Pull (`FEED_TYPE=db-optimized`): 양방향 친구 관계 및 단일 복합 인덱스 스캔 조회
3. 순수 Redis Push (`FEED_TYPE=redis`): Pipelined ZADD 기반의 모든 친구 타임라인 전송
4. 인플루언서 하이브리드 (`FEED_TYPE=hybrid`): 친구 수 5,000명 미만 일반 사용자는 Redis Push, 5,000명 이상 인플루언서는 Redis Pull 격리 후 인메모리 병합

## 테스트 시나리오 구성
1. `feed_read_benchmark.js`: 무한 스크롤(커서 페이징 3회 연속 요청) 순수 읽기 부하 테스트 (동시 사용자 최대 1,500명, 체류 시간 2~5초)
2. `feed_mixed_benchmark.js`: 읽기 80% + 쓰기 20% 혼합 트래픽 부하 테스트 (동시 사용자 최대 1,500명, 체류 시간 2~5초)

## 실행 방법

### 방법 A: k6 로컬 CLI 실행
```bash
k6 run -e FEED_TYPE=db load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=db-optimized load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=redis load-tests/feed_read_benchmark.js
k6 run -e FEED_TYPE=hybrid load-tests/feed_read_benchmark.js
```

### 방법 B: Docker를 통한 실행 (k6 미설치 시)
```bash
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=db - < load-tests/feed_read_benchmark.js
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=db-optimized - < load-tests/feed_read_benchmark.js
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=redis - < load-tests/feed_read_benchmark.js
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=hybrid - < load-tests/feed_read_benchmark.js
```

## 포트폴리오 및 보고서 수치 정리용 템플릿

| 평가 지표 | 단방향 DB Pull (`db`) | 양방향 DB Pull (`db-optimized`) | 순수 Redis Push (`redis`) | 인플루언서 하이브리드 (`hybrid`) |
| :--- | :--- | :--- | :--- | :--- |
| 최대 처리량 (RPS / TPS) | 측정값 req/s | 측정값 req/s | 측정값 req/s | 측정값 req/s |
| 평균 응답 시간 (Avg Latency) | 측정값 ms | 측정값 ms | 측정값 ms | 측정값 ms |
| 상위 95% 응답 시간 (p95) | 측정값 ms | 측정값 ms | 측정값 ms | 측정값 ms |
| 상위 99% 응답 시간 (p99) | 측정값 ms | 측정값 ms | 측정값 ms | 측정값 ms |
| 에러율 (HTTP 5xx / Fail Rate) | % | % | % | % |
| 피크 시 HikariCP Active Connections | 수치 | 수치 | 수치 | 수치 |
| 피크 시 Redis CPU / Memory | 수치 | 수치 | 수치 | 수치 |
