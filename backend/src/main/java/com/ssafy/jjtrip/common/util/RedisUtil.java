package com.ssafy.jjtrip.common.util;

import java.time.Duration;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisUtil {

    private final StringRedisTemplate stringRedisTemplate;

    public void set(String key, String value, long expireTimeMs) {
        stringRedisTemplate.opsForValue().set(key, value, Duration.ofMillis(expireTimeMs));
    }

    public String get(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    public void delete(String key) {
        stringRedisTemplate.delete(key);
    }

    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }

    public void zadd(String key, String value, double score) {
        stringRedisTemplate.opsForZSet().add(key, value, score);
    }

    public Set<String> zrevrange(String key, long start, long end) {
        return stringRedisTemplate.opsForZSet().reverseRange(key, start, end);
    }

    public Set<ZSetOperations.TypedTuple<String>> zrevrangeByScoreWithScores(
            String key, double min, double max, long offset, long count
    ) {
        return stringRedisTemplate.opsForZSet().reverseRangeByScoreWithScores(key, min, max, offset, count);
    }

    public void zaddPipelined(java.util.List<String> keys, String value, double score) {
        if (keys == null || keys.isEmpty()) {
            return;
        }
        stringRedisTemplate.executePipelined(new org.springframework.data.redis.core.SessionCallback<Object>() {
            @Override
            public Object execute(org.springframework.data.redis.core.RedisOperations operations) {
                for (String key : keys) {
                    operations.opsForZSet().add(key, value, score);
                }
                return null;
            }
        });
    }

    public void sadd(String key, long expireSeconds, String... values) {
        if (values == null || values.length == 0) {
            return;
        }
        stringRedisTemplate.opsForSet().add(key, values);
        stringRedisTemplate.expire(key, Duration.ofSeconds(expireSeconds));
    }

    public void srem(String key, Object... values) {
        if (values == null || values.length == 0) {
            return;
        }
        stringRedisTemplate.opsForSet().remove(key, values);
    }

    public boolean saddMember(String key, String value) {
        Long added = stringRedisTemplate.opsForSet().add(key, value);
        return added != null && added > 0;
    }

    public boolean sremMember(String key, String value) {
        Long removed = stringRedisTemplate.opsForSet().remove(key, value);
        return removed != null && removed > 0;
    }

    public boolean isSetMember(String key, String value) {
        return Boolean.TRUE.equals(stringRedisTemplate.opsForSet().isMember(key, value));
    }

    public Set<String> smembers(String key) {
        Set<String> members = stringRedisTemplate.opsForSet().members(key);
        return members != null ? members : java.util.Collections.emptySet();
    }

    public void saddRaw(String key, String... values) {
        if (values == null || values.length == 0) {
            return;
        }
        stringRedisTemplate.opsForSet().add(key, values);
    }

    public void hset(String key, String field, String value) {
        stringRedisTemplate.opsForHash().put(key, field, value);
    }

    public java.util.Map<Object, Object> hgetAll(String key) {
        java.util.Map<Object, Object> entries = stringRedisTemplate.opsForHash().entries(key);
        return entries != null ? entries : java.util.Collections.emptyMap();
    }

    public boolean setIfAbsent(String key, String value, long timeoutSeconds) {
        return Boolean.TRUE.equals(stringRedisTemplate.opsForValue().setIfAbsent(key, value, Duration.ofSeconds(timeoutSeconds)));
    }

    public boolean rename(String oldKey, String newKey) {
        try {
            if (!Boolean.TRUE.equals(stringRedisTemplate.hasKey(oldKey))) {
                return false;
            }
            stringRedisTemplate.rename(oldKey, newKey);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public java.util.List<Object> checkLikedStatusPipelined(
            java.util.List<Long> logIds,
            String keyPrefix,
            String memberIdStr
    ) {
        if (logIds == null || logIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return stringRedisTemplate.executePipelined(new org.springframework.data.redis.core.SessionCallback<Object>() {
            @Override
            public Object execute(org.springframework.data.redis.core.RedisOperations operations) {
                for (Long logId : logIds) {
                    String key = keyPrefix + logId;
                    operations.hasKey(key);
                    operations.opsForSet().isMember(key, memberIdStr);
                }
                return null;
            }
        });
    }
}
