package ai_service

import (
	"context"
	"encoding/json"
	"time"

	cache_service "github.com/wapikit/wapikit/services/redis_service"
)

type RedisVectorCache struct {
	client   *cache_service.RedisClient
	prefix   string
	indexKey string
}

// NewRedisVectorCache initializes a new RedisVectorCache.
func NewRedisVectorCache(client *cache_service.RedisClient) *RedisVectorCache {
	return &RedisVectorCache{
		client:   client,
		prefix:   "vector_cache:",
		indexKey: "vector_cache:keys",
	}
}

// StoreQueryEmbedding stores the embedding for a query in Redis.
// The embedding is stored as a JSON string under key "vector_cache:<query>".
func (vc *RedisVectorCache) StoreQueryEmbedding(query string, embedding []float64, ttl time.Duration) error {
	data, err := json.Marshal(embedding)
	if err != nil {
		return err
	}
	key := vc.prefix + query
	// Cache the embedding.
	if err = vc.client.CacheData(key, string(data), ttl); err != nil {
		return err
	}
	// Also add the query to an index set so we can later iterate over all embeddings.
	ctx := context.Background()
	return vc.client.Client.SAdd(ctx, vc.indexKey, query).Err()
}
