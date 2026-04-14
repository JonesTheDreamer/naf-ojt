namespace NAFServer.src.Infrastructure.Persistence.Repositories.Helper
{
    using Microsoft.EntityFrameworkCore;
    using NAFServer.src.Domain.Entities;

    public static class ResourceRequestQueryExtensions
    {
        public static IQueryable<NAF> IncludeResourceRequestsWithAdditionalInfo(this IQueryable<NAF> query)
        {
            query = query.Include(n => n.ResourceRequests)
                            .ThenInclude(rr => rr.Resource)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => rr.ResourceRequestPurposes)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => rr.ResourceRequestImplementation)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => rr.Histories)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                                .ThenInclude(step => step.Histories)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => rr.AdditionalInfo) // base navigation
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => (rr.AdditionalInfo as InternetRequestInfo).InternetResource)
                                .ThenInclude(ir => ir.Purpose)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => (rr.AdditionalInfo as SharedFolderRequestInfo).SharedFolder)
                        .Include(n => n.ResourceRequests)
                            .ThenInclude(rr => (rr.AdditionalInfo as GroupEmailRequestInfo).GroupEmail);
            return query;
        }
    }
}
