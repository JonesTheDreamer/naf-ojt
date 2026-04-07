using Microsoft.Extensions.Caching.Memory;

namespace NAFServer.src.Infrastructure.Helper
{
    public class CacheService
    {
        private readonly IMemoryCache _cache;

        public CacheService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> fetchData, MemoryCacheEntryOptions? options = null)
        {
            if (_cache.TryGetValue(key, out T cachedValue))
            {
                return cachedValue;
            }

            T data = await fetchData();

            if (data != null)
            {
                if (options != null)
                    _cache.Set(key, data, options);
                else
                    _cache.Set(key, data);
            }

            return data;
        }
        public void Set<T>(string key, T value, TimeSpan? expiration = null)
        {
            _cache.Set(key, value, expiration ?? TimeSpan.FromMinutes(10));
        }

        public void Remove(string key)
        {
            _cache.Remove(key);
        }
    }
}
