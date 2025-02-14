package cache_service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/go-redsync/redsync/v4"
	redisPoolLib "github.com/go-redsync/redsync/v4/redis/goredis/v9"
	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	*redis.Client
	RedSync                         *redsync.Redsync
	RateLimitPrefix                 string
	RedisApiServerEventChannelName  string
	RedisCampaignManagerChannelName string
}

func NewRedisClient(
	url string,
	password *string,
	IsProduction,
	IsCloudEdition bool,
	RedisApiServerEventChannelName string,
	RedisCampaignManagerChannelName string,
) *RedisClient {
	fmt.Println("Connecting to Redis...")
	var redisClient *redis.Client
	opts, err := redis.ParseURL(url)
	if err != nil {
		fmt.Println("Error parsing Redis URL: ", err)
	}
	redisClient = redis.NewClient(opts)
	_, err = redisClient.Ping(context.Background()).Result()
	if err != nil {
		fmt.Println("Error connecting to Redis: ", err)
		panic(err)
	}

	pool := redisPoolLib.NewPool(redisClient)
	redSync := redsync.New(pool)

	return &RedisClient{
		redisClient,
		redSync,
		"wapikit:rate-limit",
		RedisApiServerEventChannelName,
		RedisCampaignManagerChannelName,
	}
}

func (client *RedisClient) CacheData(key string, data interface{}, expiration time.Duration) error {
	ctx := context.Background()

	var value string
	switch v := data.(type) {
	case string:
		value = v
	default:
		jsonData, err := json.Marshal(v)
		if err != nil {
			return fmt.Errorf("failed to marshal data: %w", err)
		}
		value = string(jsonData)
	}
	err := client.Set(ctx, key, value, expiration).Err()
	if err != nil {
		return fmt.Errorf("failed to set cache data: %w", err)
	}

	return nil
}

func (client *RedisClient) GetCachedData(key string, out interface{}) (bool, error) {
	ctx := context.Background()
	val, err := client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return false, nil
		}
		return false, fmt.Errorf("failed to get cache data: %w", err)
	}

	if strPtr, ok := out.(*string); ok {
		*strPtr = val
		return true, nil
	}

	if err := json.Unmarshal([]byte(val), out); err != nil {
		return false, fmt.Errorf("failed to unmarshal cache data: %w", err)
	}

	return true, nil
}

func (client *RedisClient) ComputeCacheKey(context, id, object string) string {
	return strings.Join([]string{"wapikit", context, object, id}, ":")
}

func (client *RedisClient) PublishMessageToRedisChannel(channel string, message []byte) error {
	ctx := context.Background()
	err := client.Publish(ctx, channel, message).Err()
	if err != nil {
		return err
	}
	return nil
}

func (client *RedisClient) ComputeRateLimitKey(ipAddress, path string) string {
	return strings.Join([]string{client.RateLimitPrefix, ipAddress, path}, ":")
}

func (client *RedisClient) AcquireLock(lockKey string, ttl time.Duration) (*redsync.Mutex, error) {
	mutex := client.RedSync.NewMutex(lockKey, redsync.WithExpiry(ttl))
	// Try to acquire the lock
	if err := mutex.Lock(); err != nil {
		return nil, err
	}
	return mutex, nil
}

func (client *RedisClient) ReleaseLock(mutex *redsync.Mutex) error {
	if _, err := mutex.Unlock(); err != nil {
		return err
	}
	return nil
}
