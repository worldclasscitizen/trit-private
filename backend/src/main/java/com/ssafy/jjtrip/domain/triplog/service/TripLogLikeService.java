package com.ssafy.jjtrip.domain.triplog.service;

import com.ssafy.jjtrip.common.util.MemcachedUtil;
import com.ssafy.jjtrip.common.util.RedisUtil;
import com.ssafy.jjtrip.domain.triplog.dto.response.TripLogLikeResponseDto;
import com.ssafy.jjtrip.domain.triplog.exception.TripLogErrorCode;
import com.ssafy.jjtrip.domain.triplog.exception.TripLogException;
import com.ssafy.jjtrip.domain.triplog.mapper.TripLogMapper;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TripLogLikeService {

    private final TripLogMapper tripLogMapper;
    private final RedisUtil redisUtil;
    private final MemcachedUtil memcachedUtil;

    private static final String LIKED_USERS_KEY_PREFIX = "post:liked_users:";
    private static final String LIKE_COUNT_KEY_PREFIX = "post:like_count:";
    private static final String LIKE_BUFFER_PREFIX = "like:buffer:";
    private static final String DIRTY_LOGS_KEY = "like:dirty_logs";
    private static final String POST_ENTITY_KEY_PREFIX = "post:entity:";
    private static final String SENTINEL = "__SENTINEL__";
    private static final int DEFAULT_TTL_SECONDS = 3600;

    public TripLogLikeResponseDto getLikeStatus(Long logId, Long userId) {
        validateLogExists(logId);
        ensureLikedUsersLoaded(logId);
        boolean liked = redisUtil.isSetMember(LIKED_USERS_KEY_PREFIX + logId, String.valueOf(userId));
        int likeCount = getLikeCount(logId);
        return new TripLogLikeResponseDto(liked, likeCount);
    }

    public TripLogLikeResponseDto likeTripLog(Long logId, Long userId) {
        validateLogExists(logId);
        ensureLikedUsersLoaded(logId);

        String userIdStr = String.valueOf(userId);
        String logIdStr = String.valueOf(logId);

        boolean isNewLike = redisUtil.saddMember(LIKED_USERS_KEY_PREFIX + logId, userIdStr);
        int currentCount = getLikeCount(logId);

        if (isNewLike) {
            long newCount = memcachedUtil.incr(LIKE_COUNT_KEY_PREFIX + logId, 1L, currentCount + 1, DEFAULT_TTL_SECONDS);
            currentCount = (int) newCount;
            redisUtil.hset(LIKE_BUFFER_PREFIX + logId, userIdStr, "LIKE");
            redisUtil.saddRaw(DIRTY_LOGS_KEY, logIdStr);
        }

        return new TripLogLikeResponseDto(true, currentCount);
    }

    public TripLogLikeResponseDto unlikeTripLog(Long logId, Long userId) {
        validateLogExists(logId);
        ensureLikedUsersLoaded(logId);

        String userIdStr = String.valueOf(userId);
        String logIdStr = String.valueOf(logId);

        boolean isRemoved = redisUtil.sremMember(LIKED_USERS_KEY_PREFIX + logId, userIdStr);
        int currentCount = getLikeCount(logId);

        if (isRemoved) {
            long newCount = memcachedUtil.decr(LIKE_COUNT_KEY_PREFIX + logId, 1L, Math.max(0, currentCount - 1), DEFAULT_TTL_SECONDS);
            currentCount = (int) newCount;
            redisUtil.hset(LIKE_BUFFER_PREFIX + logId, userIdStr, "UNLIKE");
            redisUtil.saddRaw(DIRTY_LOGS_KEY, logIdStr);
        }

        return new TripLogLikeResponseDto(false, currentCount);
    }

    public int getLikeCount(Long logId) {
        Object raw = memcachedUtil.get(LIKE_COUNT_KEY_PREFIX + logId);
        if (raw != null) {
            try {
                return Integer.parseInt(raw.toString().trim());
            } catch (NumberFormatException ignored) {}
        }
        int dbCount = tripLogMapper.getLikeCount(logId);
        memcachedUtil.set(LIKE_COUNT_KEY_PREFIX + logId, DEFAULT_TTL_SECONDS, String.valueOf(dbCount));
        return dbCount;
    }

    private void validateLogExists(Long logId) {
        if (redisUtil.hasKey(LIKED_USERS_KEY_PREFIX + logId)) {
            return;
        }
        if (memcachedUtil.get(POST_ENTITY_KEY_PREFIX + logId) != null) {
            return;
        }
        if (!tripLogMapper.existsById(logId)) {
            throw new TripLogException(TripLogErrorCode.LOG_NOT_FOUND);
        }
    }

    private void ensureLikedUsersLoaded(Long logId) {
        String key = LIKED_USERS_KEY_PREFIX + logId;
        if (redisUtil.hasKey(key)) {
            return;
        }
        List<TripLogMapper.LogLikeUserPair> pairs = tripLogMapper.findLikeUserPairsByLogIds(List.of(logId));
        List<String> members = new ArrayList<>(pairs.size() + 1);
        members.add(SENTINEL);
        for (TripLogMapper.LogLikeUserPair pair : pairs) {
            members.add(String.valueOf(pair.userId()));
        }
        redisUtil.sadd(key, DEFAULT_TTL_SECONDS, members.toArray(new String[0]));
    }
}
