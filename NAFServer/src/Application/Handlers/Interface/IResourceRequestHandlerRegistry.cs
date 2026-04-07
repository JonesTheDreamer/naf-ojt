namespace NAFServer.src.Application.Handlers.Interface
{
    public interface IResourceRequestHandlerRegistry
    {
        public IResourceRequestHandler GetHandler(int requestTypeId);
    }
}
