using NAFServer.src.Application.Handlers.Interface;

namespace NAFServer.src.Application.Handlers.ResourceRequestHandler
{
    public class ResourceRequestHandlerRegistry : IResourceRequestHandlerRegistry
    {
        private readonly Dictionary<int, IResourceRequestHandler> _handlers;

        public ResourceRequestHandlerRegistry(IEnumerable<IResourceRequestHandler> handlers)
        {
            _handlers = handlers.ToDictionary(h => h.ResourceId);
        }

        public IResourceRequestHandler GetHandler(int requestTypeId)
        {
            if (!_handlers.TryGetValue(requestTypeId, out var handler))
                throw new Exception($"No handler found for ResourceRequestTypeId {requestTypeId}");

            return handler;
        }
    }
}
