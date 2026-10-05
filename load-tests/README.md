# TRIT 피드 시스템 부하 테스트 가이드 (k6)

## 개요
이 디렉터리는 k6를 활용하여 피드 시스템의 두 가지 전략(DB Fan-out on Read vs Redis Fan-out on Write)을 동시 다발적 트래픽 환경에서 비교 검증하기 위한 부하 테스트 시나리오를 포함합니다.

## 테스트 시나리오 구성
1. `feed_read_benchmark.js`: 무한 스크롤(커서 페이징 3회 연속 요청) 순수 읽기 부하 테스트 (동시 사용자 최대 300명)
2. `feed_mixed_benchmark.js`: 읽기 80% + 쓰기 20% 혼합 트래픽 부하 테스트 (동시 사용자 최대 200명)

## 실행 방법

### 방법 A: k6 로컬 CLI 실행
```bash
# DB Pull 방식 측정
k6 run -e FEED_TYPE=db load-tests/feed_read_benchmark.js

# Redis Push 방식 측정
k6 run -e FEED_TYPE=redis load-tests/feed_read_benchmark.js
```

### 방법 B: Docker를 통한 실행 (k6 미설치 시)
```bash
# DB Pull 방식
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=db - < load-tests/feed_read_benchmark.js

# Redis Push 방식
docker run --rm -i --net="host" grafana/k6 run -e FEED_TYPE=redis - < load-tests/feed_read_benchmark.js
```

## 포트폴리오 및 보고서 수치 정리용 템플릿

| 평가 지표 | DB Pull (Fan-out on Read) | Redis Push (Fan-out on Write) | 개선율 |
| :--- | :--- | :--- | :--- |
| 최대 처리량 (RPS / TPS) | 측정값 req/s | 측정값 req/s | + % |
| 평균 응답 시간 (Avg Latency) | 측정값 ms | 측정값 ms | - % |
| 상위 95% 응답 시간 (p95) | 측정값 ms | 측정값 ms | - % |
| 상위 99% 응답 시간 (p99) | 측정값 ms | 측정값 ms | - % |
| 에러율 (HTTP 5xx / Fail Rate) | % | % | - % |
| 피크 시 HikariCP Active Connections | 수치 | 수치 | - % |
