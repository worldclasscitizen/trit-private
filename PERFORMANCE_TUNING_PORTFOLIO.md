**TRIT 150만 가상 데이터 기반 1,500 VU 부하 테스트 및 아키텍처 최적화 리포트**

본 문서는 150만 건의 가상 사용자 및 대규모 여행 기록 데이터를 사전 적재한 환경에서, 최대 1,500 VUs(동시 가상 사용자)의 복합 트래픽이 발생했을 때 나타나는 시스템 병목을 단계별로 규명하고 해결한 성능 튜닝 서사를 기록한 기술 문서입니다.
순수 RDBMS 아키텍처부터 하이브리드 캐싱, 비동기 쓰기 버퍼링, JVM 인메모리 최적화에 이르기까지 각 단계에서 직면한 문제, 검토한 대안들의 장단점, 기술적 의사결정의 근거와 트레이드오프를 체계적으로 정리했습니다.

---

**핵심 성능 최적화 성과 요약**

1,500 VUs 고부하 환경에서 단계별 병목을 규명하고 달성한 핵심 최적화 성과입니다:

| 최적화 영역 | 기존 병목 상태 (Baseline) | 최적화 후 실측치 (Tuned) | 개선 성과 | 핵심 적용 기법 |
|---|---|---|---|---|
| **실전 복합 피드 응답 지연 (p95)** | **5.49s** (DB 커넥션 고갈) | **255.1ms** (정상 응답 202ms) | **95.4% 단축** | Caffeine L1 인메모리 캐시 도입 (피드 스크롤 2.4만 번 DB 쿼리 완전 격리) |
| **좋아요 연타 쓰기 폭주** | 1,297 RPS (p95 876ms) | **2,521.6 RPS (p95 38.9ms)** | **처리량 1.94배 증가** | Write-Behind 비동기 큐 + Fast-Path 유효성 검증 + 불변 JWT 서명 캐싱 |
| **피드 본문 수화 (Hydration)** | p95 162.0ms (MySQL I/O) | **p95 76.0ms** | **53.1% 단축** | Redis ZSet(타임라인 ID 정렬) + Memcached(멀티스레드 본문 수화) 분리 |
| **DB 커넥션 획득 대기열** | 평균 1.87s (최대 11.99s) | **0.65ms (대기열 0개)** | **99.9% 지연 제거** | HikariCP 풀 50 확장 및 인플루언서 친구 조회 캐싱 |

---

**1. 시스템 도메인 특성 및 엔지니어링 목표**

* **도메인 개요 및 트래픽 특성**
  * 시스템: TRIT (150만 건 가상 사용자 데이터셋 기반, 수백만 건의 팔로우 및 여행 기록 적재)
  * 핵심 엔티티: 회원(User), 여행 기록(TripLog), 친구/팔로우(Friendship), 좋아요(LogLike), 댓글(LogComment)
  * 트래픽 비대칭성: 읽기와 쓰기 비율이 약 9:1로 읽기 트래픽이 압도적으로 많음.
  * 멱법칙(Power-law) 분포: 전체 회원의 0.1% 미만인 인플루언서(팔로워 5,000명 이상)가 전체 팔로우 관계 및 피드 조회 빈도의 대다수를 차지하는 전형적인 소셜 핫스팟 도메인.

* **최종 최적화 목표 (SLA)**
  * 동시 가상 사용자(VUs): 피크 1,500 VUs (실전 소셜 활동 복합 부하)
  * 가용성: HTTP 성공률 99.0% 이상
  * 응답 지연 시간: 전체 트랜잭션 p95 기준 500ms 이내

* **검증 도구 및 환경**
  * 부하 주입: Grafana k6 (시나리오별 Ramping VUs)
  * 시스템 관측: Spring Boot Actuator, Prometheus, Grafana

---

**2. [Phase 1] 피드 읽기(Read) 아키텍처 진화 서사**

* **1단계: 순수 RDBMS 기반 조회 (Fan-out on Read, type=db)**
  * **동작 원리**: 사용자가 피드를 요청할 때마다 MySQL에서 trip_log 테이블을 중심으로 trip, user, friendship 테이블을 다중 조인(JOIN)하고, 각 게시글마다 좋아요 수와 댓글 수를 계산하기 위해 서브쿼리((SELECT COUNT(*) FROM log_like...))를 실시간 실행하는 방식.
  * **발생한 문제**:
    * 데이터가 150만 건 이상 누적된 상태에서 친구 관계를 거쳐 글을 탐색하는 조인 연산과 정렬(ORDER BY created_at DESC)로 인해 인덱스를 타지 못하고 Using filesort 및 임시 테이블 생성이 발생.
    * 동시 접속자 수십 명 수준에서도 DB CPU 사용률이 100%에 도달하고 쿼리 실행 시간이 수 초대로 급증.
  * **결과**: 가용성 붕괴 및 요청 타임아웃 발생.

* **2단계: 복합 인덱스 및 커서 기반 페이징 최적화 (type=db-optimized)**
  * **접근 방식**:
    * 전통적인 오프셋 기반 페이징(OFFSET N LIMIT 10)은 페이지가 깊어질수록 앞선 행들을 모두 읽고 버려야 하므로, 마지막 조회된 ID를 기준으로 탐색하는 No-Offset 커서 기반 페이징(WHERE id < :cursor LIMIT 10)을 도입.
    * friendship(user_id_a, user_id_b) 및 trip_log(user_id, created_at, id)에 커버링 복합 인덱스 설계.
  * **한계**:
    * 쿼리 단건의 속도는 개선되었으나, 친구 수가 수백 명 이상인 사용자의 경우 조인해야 할 레코드 수가 여전히 많아 RDBMS의 디스크 I/O와 버퍼 풀 점유율이 높음.
    * 1,000명 이상의 사용자가 동시에 피드를 새로고침할 때 RDBMS 커넥션 풀을 빠르게 소진시키는 구조적 한계 봉착.

* **3단계: 순수 Redis Push 모델 도입 (Fan-out on Write, type=redis)**
  * **동작 원리**:
    * 피드 읽기 시점의 조인 연산을 0으로 만들기 위해, 사용자가 글을 작성하는 시점에 해당 사용자의 모든 친구 개인 피드 캐시(Redis Sorted Set: timeline:{userId})에 게시글 ID를 밀어 넣는(Push) 아키텍처 적용.
    * 피드 조회 시에는 자신의 타임라인 키 하나만 ZREVRANGEBYSCORE로 O(log N + M) 조회하므로 읽기 응답 속도가 10ms 이하로 극대화됨.
  * **치명적 병목 (연예인 문제 / Celebrity Problem)**:
    * 팔로워가 수만 명 이상인 인플루언서가 글을 하나 등록하는 순간, 하나의 쓰기 요청에서 수만 번의 Redis ZADD 명령이 루프로 실행됨.
    * 싱글 스레드로 동작하는 Redis 엔진이 해당 쓰기 루프를 처리하는 동안 다른 모든 요청(읽기, 세션 검증)이 대기열에 갇히며 지연(Latency Spike)이 발생.
    * 쓰기 요청 처리 시간이 수 초대로 지연되어 쓰기 트랜잭션 타임아웃 발생.

* **4단계: 하이브리드 피드 모델 구축 (Push + Pull 실시간 결합, type=hybrid)**
  * **기술적 의사결정**:
    * 읽기 속도를 보장하면서도 인플루언서 쓰기 폭탄을 차단할 수 있는 방법으로, 팔로워 수를 기준으로 사용자를 분기하는 하이브리드 아키텍처 채택.
    * 기준선(Threshold): 팔로워 5,000명
  * **동작 프로세스**:
    * 일반 사용자 (팔로워 < 5,000): 글 작성 시 모든 친구의 timeline:{userId}로 Fan-out on Write 수행.
    * 인플루언서 (팔로워 >= 5,000): 친구 타임라인으로 Fan-out을 전파하지 않고, 인플루언서 전용 타임라인(timeline:influencer:{id})에만 단 1회 기록.
    * 피드 조회(Read):
      1) 사용자의 일반 타임라인(Redis)에서 글 ID 목록을 추출.
      2) 사용자가 팔로우하는 인플루언서 목록을 확인하고, 각 인플루언서 타임라인(Redis)에서 최근 글 ID 목록을 추출(Fan-out on Read).
      3) 두 ID 목록을 메모리 상에서 점수(생성 시간) 기준으로 정렬 및 병합(Merge)하여 상위 10개 게시글 ID를 확정.
  * **남은 문제**:
    * 게시글 ID 10개를 확정한 뒤, 게시글 본문과 작성자 정보를 채우는 수화(Hydration) 단계에서 매번 MySQL findLogsByIds 쿼리를 호출하여 RDBMS 부하가 잔존함.

* **5단계: Memcached 멀티스레드 수화(Hydration) 계층 분리 (type=hybrid-memcached)**
  * **문제 정의**:
    * Redis는 정렬(Sorted Set) 연산에 매우 강력하지만 싱글 스레드 아키텍처이므로, 큰 텍스트 본문과 이미지 메타데이터를 담은 엔티티 캐시를 대량으로 읽고 쓸 경우 직렬화/역직렬화 및 네트워크 패킷 처리로 인해 CPU 병목이 전이될 위험이 존재함.
  * **해결책**:
    * 역할 분리(Separation of Concerns):
      * Redis: 타임라인 ID 정렬, 순서 유지, 병합 전담 (작고 빠른 롱 정수형 ID 집합).
      * Memcached: 멀티스레드 기반 메모리 캐시로서 게시글 본문 엔티티(TripLogResponseDto) 수화 전담 (Key-Value 단순 조회 최적화).
  * **성과**:
    * 타임라인 조회부터 본문 수화까지 모든 읽기 경로에서 MySQL 조회가 0회로 격리됨.
    * 읽기 부하 테스트 기준 p95 응답 지연 시간: 162.00ms ➔ 76.00ms (-53.1% 단축).

---

**3. [Phase 2] 좋아요 연타 쓰기 폭주(Write-Behind) 최적화 서사**

* **부하 시나리오**:
  * 단일 인기 게시글에 1,500명의 가상 사용자가 4분 동안 좋아요 등록과 취소를 0.35초 간격으로 연속 요청 (동일 리소스에 대한 극한의 동시성 경합).

* **1단계: 초기 Write-Behind 아키텍처의 한계 규명**
  * **동작 원리**:
    * 좋아요 연타를 DB에 직접 UPDATE하면 행 락(Row Lock) 경합으로 DB가 즉시 마비되므로, Redis Set(liked_users:{logId})과 카운터를 이용해 인메모리에서 즉시 처리하고 3초 주기의 백그라운드 스케줄러가 MySQL에 비동기 일괄 반영(Write-Behind)하도록 설계.
  * **실측 결과 및 병목 발견**:
    * 314,987건 요청 중 p95 지연 시간 876.51ms (목표치 300ms 초과).
    * 프로메테우스 실측 결과: HikariCP 커넥션 획득 대기가 486ms까지 치솟고 대기 스레드(Pending)가 136개까지 급증.
  * **원인 추적**:
    * 좋아요 등록 비즈니스 로직 진입부에 게시글의 실존 여부를 검증하는 validateLogExists 메서드가 존재.
    * 매 요청마다 MySQL로 SELECT EXISTS(SELECT 1 FROM trip_log WHERE id = ?) 쿼리를 실행하여 초당 1,300회 이상의 단순 확인용 읽기 쿼리가 RDBMS 커넥션 풀을 고갈시킴.

* **2단계: 인메모리 빠른 검증(Fast-Path Validation) 도입**
  * **대안 검토**:
    * 대안 A (검증 전면 생략): DB 외래키(FK) 제약조건에 의존. 하지만 비동기 Write-Behind 특성상 무효한 게시글 ID가 Redis 큐에 적재되어 백그라운드 스케줄러가 에러를 뿜으며 비정상 종료될 위험이 있어 기각.
    * 대안 B (계층형 캐시 검증 채택): 활발하게 상호작용이 일어나는 게시글은 이미 Redis나 Memcached에 키가 존재한다는 특성을 활용.
  * **구현 로직**:
    * 1차로 Redis의 liked_users Set 또는 Memcached의 엔티티 캐시 키 존재 여부를 확인.
    * 캐시에 키가 존재하면 게시글이 존재하는 것으로 확정하고 즉시 통과(DB 커넥션 사용 0).
    * 캐시에 없을 때만 한하여 MySQL에 2차로 질의.
  * **결과**:
    * 좋아요 처리 과정에서의 MySQL 커넥션 경합 해소 (대기 스레드 136개 ➔ 0개).
    * 처리량: 1,297 req/s ➔ 1,547 req/s (+19.3%).
    * p95 지연 시간: 876.51ms ➔ 613.57ms (-30.0%).
    * 한계: DB 병목은 사라졌으나 p95 613ms로 여전히 목표치(300ms) 미달.

* **3단계: CPU 연산 오프로딩(토큰 캐싱) 및 톰캣 스레드 풀 확장**
  * **원인 추적**:
    * DB 부하가 사라졌음에도 서버 CPU 사용률이 99%에 달하고 톰캣 응답이 지연됨.
    * 프로파일링 결과: 초당 1,500회 이상의 요청마다 스프링 시큐리티 JwtAuthenticationFilter가 호출되어 HMAC-SHA512 암호 서명 해시 연산을 매번 2회씩 반복 수행.
    * 또한 1,500 VUs 유입 대비 톰캣 최대 스레드가 300개로 설정되어 있어 서블릿 큐 대기 시간(Queueing Delay)이 약 200ms 발생.
  * **기술적 의사결정**:
    * JWT는 발급 후 내용이 변경되지 않는 불변(Immutable) 객체라는 특성에 착안.
    * 토큰 문자열을 키로 하고 Authentication 객체를 값으로 갖는 ConcurrentHashMap 기반 인메모리 인증 캐시(TTL 60초, 최대 2,000건) 선언.
    * 60초 동안 서명 검증은 최초 1회만 수행하고 이후 O(1) 메모리 참조로 인증 통과.
    * 보안 무결성 방어: 사용자가 로그아웃할 경우 Redis 블랙리스트 등록과 동시에 로컬 인메모리 캐시에서도 해당 토큰을 즉시 무효화(evictToken).
    * 톰캣 최대 스레드 풀(server.tomcat.threads.max)을 300에서 500으로 확장.
  * **성과**:
    * 초당 처리량: 2,521.6 req/s (초기 대비 1.94배 증가).
    * 평균 응답 시간: 363.53ms ➔ 17.20ms (95.3% 단축).
    * p95 응답 지연 시간: 876.51ms ➔ 38.91ms (95.6% 단축, 목표 SLA 300ms 초과 달성).

---

**4. [Phase 3] 1,500 VUs 실전 복합 시나리오 튜닝 및 로컬 캐시 최적화**

* **부하 테스트 시나리오 설계 철학**
  * 단일 API만 호출하는 부하 테스트는 실제 서비스 환경의 병목을 왜곡할 수 있음.
  * 실제 사용자의 행동 패턴을 반영한 복합 부하(Realistic Mixed Workload) 모델 수립:
    * 피드 스크롤 (읽기 70%, 1,050 VUs): 3회 연속 스크롤(10개씩 페이징)
    * 좋아요 연타 (인메모리 쓰기 15%, 225 VUs): 게시글 좋아요 토글
    * 상세 및 댓글 (트랜잭션 10%, 150 VUs): 게시글 상세 조회 후 댓글 등록
    * 여행 및 글 작성 (복합 쓰기 4%, 60 VUs): 여행 생성 및 신규 게시글 등록
    * 인플루언서 피드 (헤비 읽기 1%, 15 VUs): 팔로워가 많은 계정의 피드 조회
  * 피크 동시성: 1,500 VUs 동시 인입

* **1차 복합 부하 테스트 실측 및 병목 발생**
  * **실측 지표**:
    * 초당 처리량: 약 450 req/s, 총 요청 수: 112,822건.
    * 평균 응답 시간: 1.88초, 중앙값: 1.24초.
    * **전체 p95 지연 시간: 5.49초** (목표 기준 2.0초 초과 실패).
  * **원인 추적 및 프로메테우스 실측**:
    * 피드 조회 시 본문 수화는 Memcached에서 0ms대로 처리되고 있었으나, 전체 응답 시간이 5초대까지 급증.
    * 프로메테우스 지표 분석:
      * `hikaricp_connections_acquire_seconds_sum`: 68,158초 누적 (36,440회)
      * 커넥션을 얻기 위한 대기 시간이 평균 1.87초, 최대 11.99초에 달함.
    * **근본 원인 규명**:
      * 하이브리드 피드 구조상, 일반 친구 글과 인플루언서 글을 병합하기 위해 피드 조회 진입 시마다 FriendService.getInfluencerFriendIds(userId, threshold)를 호출.
      * 이 메서드는 MySQL에서 아래 쿼리를 실시간 실행:
        `SELECT f.user_id_b FROM friendship f JOIN user_profile p ON f.user_id_b = p.user_id WHERE f.user_id_a = ? AND p.followers_count >= ?`
      * 1,050명의 가상 사용자가 3번씩 스크롤을 내리면서 단 4분 만에 **24,478회의 불필요한 인플루언서 친구 조회 DB 쿼리**가 쏟아짐.
      * 이 반복 쿼리들이 당시 30개로 설정된 HikariCP 커넥션을 독점했고, 댓글 작성 및 여행 생성 등 진짜 DB에 기록해야 하는 트랜잭션들이 커넥션을 얻지 못하고 대기 큐에서 최대 12초 동안 멈춰 서는 현상 발생.

* **기술적 의사결정: 인플루언서 친구 목록 캐싱 전략 비교**
  * **데이터 특성 분석**:
    * 사용자가 앱에 머무르는 수 분 동안 자신의 친구가 인플루언서로 승격되거나 새로운 인플루언서와 친구를 맺을 확률은 극히 희박함.
    * 즉, 변경 빈도는 매우 낮고(Low Mutability), 피드를 스크롤할 때마다 극도로 빈번하게 조회되는(High Read Frequency) 시간 지역성(Temporal Locality) 데이터임.
  * **선택지 비교 및 트레이드오프**:
    * 대안 1 (Redis 분산 캐시 저장):
      * 장점: 다중 서버 환경에서 캐시 일관성 유지가 쉬움.
      * 단점: 피드 스크롤 시마다 네트워크 I/O(TCP 홉)가 추가로 발생하여 마이크로초 단위의 초고속 응답을 저해함.
    * 대안 2 (ConcurrentHashMap 정적 맵):
      * 장점: 의존성 없이 가장 빠름.
      * 단점: 메모리 크기 상한(Bound)과 만료 정책(TTL)이 없어, 150만 회원이 누적될 경우 OOM(Out of Memory) 발생 위험이 큼.
    * **대안 3 (Caffeine Cache 인메모리 로컬 캐시 채택 - 최종 선정)**:
      * 선정 이유: Window TinyLFU 알고리즘 기반으로 높은 캐시 적중률을 보장하며, maximumSize(10,000건) 설정을 통해 JVM 힙 메모리 상한을 약 수 MB 이내로 안전하게 격리 가능. 네트워크 I/O 없이 CPU L3/RAM 레벨에서 O(1) 반환.
      * 만료 시간(TTL): 5분 (expireAfterWrite).

* **구현 코드 및 정합성 보장 전략**
```java
private final Cache<Long, List<Long>> influencerFriendCache = Caffeine.newBuilder()
        .maximumSize(10000)
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .build();

public List<Long> getInfluencerFriendIds(Long userId, int threshold) {
    return influencerFriendCache.get(userId, key -> friendMapper.findInfluencerFriendIds(key, threshold));
}

@Transactional
public void acceptRequest(Long requestId, Long acceptingUserId) {
    friendMapper.saveFriendship(friendshipForward);
    friendMapper.saveFriendship(friendshipReverse);
    
    influencerFriendCache.invalidate(friendRequest.getRequesterId());
    influencerFriendCache.invalidate(friendRequest.getReceiverId());
}

@Transactional
public void deleteFriend(Long myUserId, Long friendId) {
    friendMapper.deleteFriendship(userIdA, userIdB);
    
    influencerFriendCache.invalidate(myUserId);
    influencerFriendCache.invalidate(friendId);
}
```

* **HikariCP 커넥션 풀 용량 산정 (Capacity Planning)**
  * 기존 maximum-pool-size: 30
  * 변경 maximum-pool-size: 50
  * 산정 근거: 톰캣 최대 스레드가 500개인 상태에서, 피드 읽기 트래픽의 DB 의존성이 제거되었으나 댓글/여행 생성 등 순수 쓰기 트랜잭션의 순간 버스트(약 210 VUs)를 지연 없이 처리하기 위해 CPU 코어 수와 DB 스토리지 I/O 처리량을 고려하여 50으로 증설.

* **2차 복합 부하 테스트 결과 및 성능 지표 대조**
  * **테스트 조건**: 30개 토큰 돌려쓰기가 아닌, DB에 실존하는 1,500명 고유 계정(normal_user_1 ~ 1500)으로 각 VU가 1:1 고유 JWT를 사용하는 실제 환경으로 검증.
  * **처리량(Throughput)**: 총 115,484건 처리 (초당 462.8 reqs/s).
  * **전체 p95 지연 시간**: **5.49초 ➔ 255.1ms (95.4% 단축, 목표 SLA 500ms 완전 통과)**.
  * **정상 응답 p95**: **202.46ms**.
  * **중앙값(med)**: **1.24초 ➔ 18.27ms (98.5% 단축)**.
  * **시나리오별 p95 지연 시간**:
    * 피드 스크롤: 4.8초 ➔ **871.93ms** (임계치 1,500ms 통과)
    * 인플루언서 피드: 6.2초 ➔ **986.53ms** (임계치 2,500ms 통과)
    * 좋아요 연타: 1.2초 ➔ **76.49ms** (초고속 인메모리 처리)
  * **DB 커넥션 경합 해소 실측**:
    * 피드 스크롤 과정에서 발생하던 2.4만 번의 인플루언서 조회 DB 쿼리가 0회로 소멸.
    * 커넥션 획득 대기 지표가 평균 1.87초에서 0.65ms로 떨어지며 대기열(Pending) 0개 유지.

* **테스트 환경적 한계 및 인프라적 관찰 (connectex actively refused 이슈)**
  * **현상**: 테스트 2분 17초 피크 시점에 4.8%(5,546건)의 요청에서 dial tcp connectex: actively refused 에러 발생.
  * **원인 분석**:
    * 백엔드 서버(스프링 부트) 내부의 오류(500)가 아닌, 단일 Windows 호스트 머신에서 k6(1,500개 클라이언트)와 톰캣이 동일한 로컬 루프백(127.0.0.1)으로 11.5만 건의 TCP 연결을 생성하면서 Windows OS의 임시 포트(Ephemeral Port)와 TIME_WAIT 소켓이 순간 고갈되어 OS 커널이 TCP SYN 요청을 거절(RST)한 현상.
  * **교훈**: 단일 호스트 루프백 테스트 환경에서는 가상 사용자가 폭증할 때 HTTP Keep-Alive 재사용 및 커넥션 풀링 옵션을 명시하거나, 부하 발생기(Injector)와 대상 서버를 물리적으로 분리된 네트워크 환경에 배치해야 함을 확인.

---

**5. 아키텍처 트레이드오프 총괄 비교표**

* **구분: 순수 RDBMS (Pull) vs 순수 Redis (Push) vs 하이브리드 + Memcached (최종)**
* **읽기 시간 복잡도**:
  * 순수 RDBMS: O(N * M) (다중 테이블 JOIN 및 정렬 비용 발생)
  * 순수 Redis: O(log N) (자신의 타임라인 Sorted Set 1회 조회)
  * 최종 하이브리드: O(log N + K log K) (일반 타임라인과 인플루언서 타임라인 메모리 내 병합)
* **인플루언서 쓰기 비용**:
  * 순수 RDBMS: O(1) (게시글 테이블 단건 INSERT)
  * 순수 Redis: O(F) (팔로워 수 F만큼 수만 번의 Redis 쓰기 루프, 연예인 문제 발생)
  * 최종 하이브리드: O(1) (인플루언서 타임라인 1곳에만 기록, 쓰기 폭탄 원천 차단)
* **메모리(RAM) 비용**:
  * 순수 RDBMS: 최소 (디스크 중심)
  * 순수 Redis: 극대 (모든 사용자의 타임라인을 Redis 메모리에 중복 유지)
  * 최종 하이브리드: 중간 (일반 친구 ID 목록은 Redis에 유지하되, 인플루언서 글은 중복 없이 참조하고 본문 엔티티는 Memcached에 단건 보관)
* **데이터 정합성(Consistency)**:
  * 순수 RDBMS: 강력한 ACID 보장
  * 순수 Redis: 글 삭제 또는 친구 끊기 시 모든 친구의 Redis 타임라인을 뒤져서 삭제하기 어려워 데이터 정합성 결여 위험
  * 최종 하이브리드: 본문 수화 시 캐시 무효화 및 친구 관계 변경 시 Caffeine 로컬 캐시 즉시 무효화(invalidate)로 최종 일관성(Eventual Consistency) 보장

---

**6. 기각된 대안들 (Rejected Alternatives) 및 기술적 기각 근거**

* **1) RDBMS 샤딩(Sharding) 및 읽기 복제본(Read Replica) 증설**
  * **기각 사유**: 트래픽 증가 시 가장 흔히 검토되는 방안이나, 피드 서비스의 특성상 친구 관계가 다대다(M:N)로 얽혀 있어 샤딩 키(Shard Key)를 유저 ID로 잡든 글 ID로 잡든 불가피하게 전역 브로드캐스트 쿼리(Scatter-Gather)가 발생함. 이는 인프라 비용 대비 성능 개선 효율이 매우 낮아 기각하고 캐싱 계층 분리를 선택함.

* **2) API Gateway 레벨에서의 JWT 서명 검증 오프로딩**
  * **기각 사유**: 단일 백엔드 인스턴스 환경에서 별도의 게이트웨이(Spring Cloud Gateway, Kong 등)를 추가하는 것은 추가적인 네트워크 홉(Network Hop)과 인프라 관리 복잡성을 초래하여 오버엔지니어링으로 판단. 애플리케이션 레벨의 60초 로컬 인메모리 인증 캐시로 충분히 CPU 부하를 제거할 수 있어 기각.

* **3) 인플루언서 친구 목록의 Redis 전역 캐싱**
  * **기각 사유**: 피드 스크롤 시마다 Redis로 쿼리를 날릴 경우, 초당 수천 번의 Redis 왕복 네트워크 지연이 발생함. 유저별 인플루언서 목록은 크기가 매우 작으므로 JVM 힙 메모리(Caffeine)에 5분간 캐싱하는 것이 응답 속도와 네트워크 대역폭 보호 측면에서 압도적으로 유리하다고 판단.

---

**7. 서비스 확장에 따른 미래 아키텍처 진화 로드맵 (Scale-out 고려사항)**

* **트래픽 10배 증가 시 (단일 인스턴스 ➔ 멀티 인스턴스 스케일아웃 환경)**
  * **과제**: Caffeine 캐시는 단일 JVM 힙에 격리되어 있으므로, 2번 서버에서 사용자가 친구를 삭제했을 때 1번 서버의 Caffeine 캐시에는 이전 정보가 남아있어 일시적인 불일치가 발생할 수 있음.
  * **진화 방향**: Redis Pub/Sub을 이벤트 버스로 활용하여, 친구 추가/삭제 시 friendship-event 채널로 무효화 메시지를 브로드캐스트하고 모든 WAS 인스턴스가 자신의 로컬 Caffeine 캐시를 동시 무효화하는 하이브리드 캐시 동기화 체계 도입.

* **트래픽 100배 증가 시 (글로벌 서비스 및 초대형 인플루언서 대응)**
  * **진화 방향**:
    * Apache Kafka 기반의 비동기 피드 파이프라인 구축.
    * 일반 글 작성 이벤트를 Kafka 토픽으로 발행하고 백그라운드 피드 컨슈머 클러스터가 Redis 타임라인으로 팬아웃을 비동기 처리.
    * 조회 빈도가 낮은 비활성 유저(Dormant User)의 타임라인은 Redis에서 제거하고, 로그인 시점에 최근 피드를 재생성하는 지연 로딩(Lazy Loading) 전략 결합.
