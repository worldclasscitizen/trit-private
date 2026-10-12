package com.ssafy.jjtrip.common.util;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.rubyeye.xmemcached.MemcachedClient;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemcachedUtil {

    private final MemcachedClient memcachedClient;

    public void set(String key, int expireSeconds, Object value) {
        try {
            memcachedClient.set(key, expireSeconds, value);
        } catch (Exception e) {
            log.warn("Memcached set failed for key {}: {}", key, e.getMessage());
        }
    }

    public <T> T get(String key) {
        try {
            return memcachedClient.get(key);
        } catch (Exception e) {
            log.warn("Memcached get failed for key {}: {}", key, e.getMessage());
            return null;
        }
    }

    public <T> Map<String, T> getMulti(Collection<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            Map<String, T> result = memcachedClient.get(keys);
            return result != null ? result : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Memcached getMulti failed: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    public void delete(String key) {
        try {
            memcachedClient.delete(key);
        } catch (Exception e) {
            log.warn("Memcached delete failed for key {}: {}", key, e.getMessage());
        }
    }

    public long incr(String key, long delta, long initValue, int expireSeconds) {
        try {
            return memcachedClient.incr(key, delta, initValue, 1500, expireSeconds);
        } catch (Exception e) {
            log.warn("Memcached incr failed for key {}: {}", key, e.getMessage());
            return initValue;
        }
    }

    public long decr(String key, long delta, long initValue, int expireSeconds) {
        try {
            return memcachedClient.decr(key, delta, initValue, 1500, expireSeconds);
        } catch (Exception e) {
            log.warn("Memcached decr failed for key {}: {}", key, e.getMessage());
            return initValue;
        }
    }
}
