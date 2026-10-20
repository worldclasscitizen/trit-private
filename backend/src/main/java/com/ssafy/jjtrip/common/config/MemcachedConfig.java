package com.ssafy.jjtrip.common.config;

import java.io.IOException;
import net.rubyeye.xmemcached.MemcachedClient;
import net.rubyeye.xmemcached.MemcachedClientBuilder;
import net.rubyeye.xmemcached.XMemcachedClientBuilder;
import net.rubyeye.xmemcached.command.BinaryCommandFactory;
import net.rubyeye.xmemcached.impl.KetamaMemcachedSessionLocator;
import net.rubyeye.xmemcached.utils.AddrUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MemcachedConfig {

    @Value("${memcached.servers:localhost:21211}")
    private String servers;

    @Value("${memcached.pool-size:4}")
    private int poolSize;

    @Bean(destroyMethod = "shutdown")
    public MemcachedClient memcachedClient() throws IOException {
        MemcachedClientBuilder builder = new XMemcachedClientBuilder(AddrUtil.getAddresses(servers));
        builder.setConnectionPoolSize(poolSize);
        builder.setCommandFactory(new BinaryCommandFactory());
        builder.setSessionLocator(new KetamaMemcachedSessionLocator());
        builder.setConnectTimeout(3000);
        builder.setOpTimeout(1500);
        builder.setFailureMode(false);
        return builder.build();
    }
}
