package com.ssafy.jjtrip.domain.triplog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.jjtrip.common.util.MemcachedUtil;
import com.ssafy.jjtrip.common.util.RedisUtil;
import com.ssafy.jjtrip.domain.triplog.dto.response.TripLogFeedResponseDto;
import com.ssafy.jjtrip.domain.triplog.dto.response.TripLogImageResponseDto;
import com.ssafy.jjtrip.domain.triplog.mapper.TripLogMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedCacheService {

    private static final String POST_ENTITY_KEY_PREFIX = "post:entity:";
    private static final String USER_PROFILE_KEY_PREFIX = "user:profile:";
    private static final String LIKE_COUNT_KEY_PREFIX = "post:like_count:";
    private static final String COMMENT_COUNT_KEY_PREFIX = "post:comment_count:";
    private static final String LIKED_USERS_KEY_PREFIX = "post:liked_users:";
    private static final String SENTINEL_MEMBER = "-1";
    private static final int DEFAULT_TTL_SECONDS = 3600;

    private final MemcachedUtil memcachedUtil;
    private final RedisUtil redisUtil;
    private final TripLogMapper tripLogMapper;
    private final ObjectMapper objectMapper;

    public record CachedPostEntity(
            Long logId,
            Long authorId,
            String title,
            String content,
            String locationSummary,
            List<TripLogImageResponseDto> images,
            LocalDateTime createdAt
    ) {}

    public record CachedAuthorProfile(
            Long authorId,
            String nickname,
            String profileImageUrl
    ) {}

    public List<TripLogFeedResponseDto> hydrateFeedLogs(List<Long> logIds, Long memberId) {
        if (logIds == null || logIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> firstBatchKeys = new ArrayList<>(logIds.size() * 3);
        for (Long logId : logIds) {
            firstBatchKeys.add(POST_ENTITY_KEY_PREFIX + logId);
            firstBatchKeys.add(LIKE_COUNT_KEY_PREFIX + logId);
            firstBatchKeys.add(COMMENT_COUNT_KEY_PREFIX + logId);
        }

        Map<String, Object> firstMget = memcachedUtil.getMulti(firstBatchKeys);

        Map<Long, CachedPostEntity> postMap = new HashMap<>();
        Map<Long, Integer> likeCountMap = new HashMap<>();
        Map<Long, Integer> commentCountMap = new HashMap<>();
        Map<Long, CachedAuthorProfile> authorMap = new HashMap<>();
        Map<Long, Boolean> likedMap = new HashMap<>();

        List<Long> missedLogIds = new ArrayList<>();

        for (Long logId : logIds) {
            Object rawPost = firstMget.get(POST_ENTITY_KEY_PREFIX + logId);
            Object rawLikes = firstMget.get(LIKE_COUNT_KEY_PREFIX + logId);
            Object rawComments = firstMget.get(COMMENT_COUNT_KEY_PREFIX + logId);

            CachedPostEntity entity = deserialize(rawPost, CachedPostEntity.class);
            Integer likeCount = parseCounter(rawLikes);
            Integer commentCount = parseCounter(rawComments);

            if (entity != null && likeCount != null && commentCount != null) {
                postMap.put(logId, entity);
                likeCountMap.put(logId, likeCount);
                commentCountMap.put(logId, commentCount);
            } else {
                missedLogIds.add(logId);
            }
        }

        if (!missedLogIds.isEmpty()) {
            List<TripLogFeedResponseDto.FeedData> dbFeeds = tripLogMapper.findLogsByIds(missedLogIds, memberId);
            List<TripLogMapper.ImageInfo> dbImages = tripLogMapper.findImagesByLogIds(missedLogIds);

            Map<Long, List<TripLogImageResponseDto>> imagesByLogId = dbImages.stream()
                    .collect(Collectors.groupingBy(
                            TripLogMapper.ImageInfo::logId,
                            Collectors.mapping(
                                    img -> new TripLogImageResponseDto(img.imageRefKey(), img.imageUrl(), img.orderIndex()),
                                    Collectors.toList()
                            )
                    ));

            for (TripLogFeedResponseDto.FeedData data : dbFeeds) {
                List<TripLogImageResponseDto> images = imagesByLogId.getOrDefault(data.logId(), Collections.emptyList());
                CachedPostEntity entity = new CachedPostEntity(
                        data.logId(),
                        data.authorId(),
                        data.title(),
                        data.content(),
                        data.locationSummary(),
                        images,
                        data.createdAt()
                );
                CachedAuthorProfile profile = new CachedAuthorProfile(
                        data.authorId(),
                        data.authorNickname(),
                        data.authorImageUrl()
                );

                postMap.put(data.logId(), entity);
                likeCountMap.put(data.logId(), data.likeCount());
                commentCountMap.put(data.logId(), data.commentCount());
                authorMap.put(data.authorId(), profile);
                likedMap.put(data.logId(), data.liked());

                serializeAndSet(POST_ENTITY_KEY_PREFIX + data.logId(), entity);
                serializeAndSet(USER_PROFILE_KEY_PREFIX + data.authorId(), profile);
                memcachedUtil.set(LIKE_COUNT_KEY_PREFIX + data.logId(), DEFAULT_TTL_SECONDS, String.valueOf(data.likeCount()));
                memcachedUtil.set(COMMENT_COUNT_KEY_PREFIX + data.logId(), DEFAULT_TTL_SECONDS, String.valueOf(data.commentCount()));
            }
        }

        Set<Long> neededAuthorIds = new HashSet<>();
        for (CachedPostEntity entity : postMap.values()) {
            if (!authorMap.containsKey(entity.authorId())) {
                neededAuthorIds.add(entity.authorId());
            }
        }

        if (!neededAuthorIds.isEmpty()) {
            List<String> authorKeys = neededAuthorIds.stream()
                    .map(id -> USER_PROFILE_KEY_PREFIX + id)
                    .toList();
            Map<String, Object> secondMget = memcachedUtil.getMulti(authorKeys);

            List<Long> missedAuthorIds = new ArrayList<>();
            for (Long authorId : neededAuthorIds) {
                Object rawProfile = secondMget.get(USER_PROFILE_KEY_PREFIX + authorId);
                CachedAuthorProfile profile = deserialize(rawProfile, CachedAuthorProfile.class);
                if (profile != null) {
                    authorMap.put(authorId, profile);
                } else {
                    missedAuthorIds.add(authorId);
                }
            }

            if (!missedAuthorIds.isEmpty()) {
                List<TripLogMapper.AuthorProfileInfo> dbAuthors = tripLogMapper.findAuthorProfilesByIds(missedAuthorIds);
                for (TripLogMapper.AuthorProfileInfo info : dbAuthors) {
                    CachedAuthorProfile profile = new CachedAuthorProfile(
                            info.authorId(),
                            info.nickname(),
                            info.profileImageUrl()
                    );
                    authorMap.put(info.authorId(), profile);
                    serializeAndSet(USER_PROFILE_KEY_PREFIX + info.authorId(), profile);
                }
            }
        }

        if (memberId != null) {
            List<Long> logIdsForLikeCheck = logIds.stream()
                    .filter(id -> postMap.containsKey(id) && !likedMap.containsKey(id))
                    .toList();

            if (!logIdsForLikeCheck.isEmpty()) {
                resolveLikedBatch(logIdsForLikeCheck, memberId, likedMap);
            }
        }

        List<TripLogFeedResponseDto> result = new ArrayList<>(logIds.size());
        for (Long logId : logIds) {
            CachedPostEntity entity = postMap.get(logId);
            if (entity == null) {
                continue;
            }
            CachedAuthorProfile author = authorMap.get(entity.authorId());
            String nickname = author != null ? author.nickname() : "";
            String authorImageUrl = author != null ? author.profileImageUrl() : null;
            int likeCount = likeCountMap.getOrDefault(logId, 0);
            int commentCount = commentCountMap.getOrDefault(logId, 0);
            boolean liked = memberId != null && Boolean.TRUE.equals(likedMap.get(logId));

            result.add(new TripLogFeedResponseDto(
                    entity.logId(),
                    entity.authorId(),
                    nickname,
                    authorImageUrl,
                    entity.title(),
                    entity.content(),
                    entity.locationSummary(),
                    likeCount,
                    commentCount,
                    liked,
                    entity.images(),
                    entity.createdAt()
            ));
        }

        return result;
    }

    private void resolveLikedBatch(List<Long> logIds, Long memberId, Map<Long, Boolean> likedMap) {
        String memberIdStr = String.valueOf(memberId);
        List<Object> pipelineRes = redisUtil.checkLikedStatusPipelined(logIds, LIKED_USERS_KEY_PREFIX, memberIdStr);

        List<Long> missedLikeSetLogIds = new ArrayList<>();
        for (int i = 0; i < logIds.size(); i++) {
            Long logId = logIds.get(i);
            int baseIdx = i * 2;
            if (pipelineRes.size() > baseIdx + 1) {
                Boolean keyExists = (Boolean) pipelineRes.get(baseIdx);
                Boolean isMember = (Boolean) pipelineRes.get(baseIdx + 1);
                if (Boolean.TRUE.equals(keyExists)) {
                    likedMap.put(logId, Boolean.TRUE.equals(isMember));
                    continue;
                }
            }
            missedLikeSetLogIds.add(logId);
        }

        if (!missedLikeSetLogIds.isEmpty()) {
            List<TripLogMapper.LogLikeUserPair> pairs = tripLogMapper.findLikeUserPairsByLogIds(missedLikeSetLogIds);
            Map<Long, List<String>> likersByLogId = new HashMap<>();
            for (Long logId : missedLikeSetLogIds) {
                List<String> list = new ArrayList<>();
                list.add(SENTINEL_MEMBER);
                likersByLogId.put(logId, list);
            }
            for (TripLogMapper.LogLikeUserPair pair : pairs) {
                likersByLogId.computeIfAbsent(pair.logId(), k -> {
                    List<String> list = new ArrayList<>();
                    list.add(SENTINEL_MEMBER);
                    return list;
                }).add(String.valueOf(pair.userId()));
            }

            for (Long logId : missedLikeSetLogIds) {
                List<String> members = likersByLogId.get(logId);
                redisUtil.sadd(LIKED_USERS_KEY_PREFIX + logId, DEFAULT_TTL_SECONDS, members.toArray(new String[0]));
                likedMap.put(logId, members.contains(memberIdStr));
            }
        }
    }

    public void evictPostEntity(Long logId) {
        memcachedUtil.delete(POST_ENTITY_KEY_PREFIX + logId);
        memcachedUtil.delete(LIKE_COUNT_KEY_PREFIX + logId);
        memcachedUtil.delete(COMMENT_COUNT_KEY_PREFIX + logId);
        redisUtil.delete(LIKED_USERS_KEY_PREFIX + logId);
        redisUtil.delete("like:buffer:" + logId);
        redisUtil.srem("like:dirty_logs", String.valueOf(logId));
    }

    public void evictAuthorProfile(Long userId) {
        memcachedUtil.delete(USER_PROFILE_KEY_PREFIX + userId);
    }

    public void syncLikeAdded(Long logId, Long userId, int updatedLikeCount) {
        memcachedUtil.set(LIKE_COUNT_KEY_PREFIX + logId, DEFAULT_TTL_SECONDS, String.valueOf(updatedLikeCount));
        String redisKey = LIKED_USERS_KEY_PREFIX + logId;
        if (redisUtil.hasKey(redisKey)) {
            redisUtil.sadd(redisKey, DEFAULT_TTL_SECONDS, String.valueOf(userId));
        }
    }

    public void syncLikeRemoved(Long logId, Long userId, int updatedLikeCount) {
        memcachedUtil.set(LIKE_COUNT_KEY_PREFIX + logId, DEFAULT_TTL_SECONDS, String.valueOf(updatedLikeCount));
        String redisKey = LIKED_USERS_KEY_PREFIX + logId;
        if (redisUtil.hasKey(redisKey)) {
            redisUtil.srem(redisKey, String.valueOf(userId));
        }
    }

    public void syncCommentCount(Long logId, int updatedCommentCount) {
        memcachedUtil.set(COMMENT_COUNT_KEY_PREFIX + logId, DEFAULT_TTL_SECONDS, String.valueOf(updatedCommentCount));
    }

    public void incrementCommentCount(Long logId) {
        if (memcachedUtil.get(COMMENT_COUNT_KEY_PREFIX + logId) != null) {
            memcachedUtil.incr(COMMENT_COUNT_KEY_PREFIX + logId, 1, 1, DEFAULT_TTL_SECONDS);
        }
    }

    public void decrementCommentCount(Long logId) {
        if (memcachedUtil.get(COMMENT_COUNT_KEY_PREFIX + logId) != null) {
            memcachedUtil.decr(COMMENT_COUNT_KEY_PREFIX + logId, 1, 0, DEFAULT_TTL_SECONDS);
        }
    }

    private void serializeAndSet(String key, Object value) {
        try {
            String json = objectMapper.writeValueAsString(value);
            memcachedUtil.set(key, DEFAULT_TTL_SECONDS, json);
        } catch (Exception e) {
            log.warn("Failed to serialize cache object for key {}: {}", key, e.getMessage());
        }
    }

    private <T> T deserialize(Object raw, Class<T> clazz) {
        if (raw == null) {
            return null;
        }
        try {
            return objectMapper.readValue(String.valueOf(raw), clazz);
        } catch (Exception e) {
            log.warn("Failed to deserialize cache object to {}: {}", clazz.getSimpleName(), e.getMessage());
            return null;
        }
    }

    private Integer parseCounter(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
