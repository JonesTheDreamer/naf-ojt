using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.DTOs.ResourceRequestApprovalStep;
using NAFServer.src.Application.DTOs.ResourceRequestApprovalStepHistory;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Mapper.Helper;

namespace NAFServer.src.Mapper
{
    public class ResourceRequestMapper
    {
        public static ResourceRequestDTO ToDTO(ResourceRequest rr)
        {
            return new ResourceRequestDTO(
                     rr.Id,
                     rr.CurrentStep,
                     rr.Progress,
                     rr.AccomplishedAt,
                     rr.CancelledAt,
                     rr.DateNeeded,
                     rr.NAFId,
                     rr.ApprovalWorkflowTemplateId,
                     new ResourceDTO(
                         rr.Resource.Id,
                         rr.Resource.Name,
                         rr.Resource.IconUrl,
                         rr.Resource.IsActive,
                         rr.Resource.IsSpecial,
                         rr.Resource.Color
                     ),
                     rr.AdditionalInfo != null ? AdditionalInfoMapper.MapAdditionalInfo(rr.AdditionalInfo) : null,
                     rr.Histories.Select(h => new ResourceRequestHistoryDTO(
                        h.Id,
                        h.ResourceRequestId,
                        h.Type,
                        h.Description,
                        h.CreatedAt
                    )).ToList(),
                     rr.ResourceRequestPurposes.Select(p => new ResourceRequestPurposeDTO(
                         p.Id,
                         p.Purpose,
                         p.ResourceRequestId,
                         p.ResourceRequestApprovalStepHistoryId,
                         p.CreatedAt
                     )).ToList(),
                     rr.ResourceRequestsApprovalSteps
                         .Select(s => new ResourceRequestApprovalStepDTO(
                             s.Id,
                             s.ResourceRequestId,
                             s.StepOrder,
                             s.ApproverId,
                             null,
                             s.Progress,
                             s.ApprovedAt,
                             s.Histories
                                 .Select(h => new ResourceRequestApprovalStepHistoryDTO(
                                     h.Id,
                                     h.Status,
                                     h.Comment,
                                     h.ReasonForRejection,
                                     h.ActionAt,
                                     h.ResourceRequestApprovalStepId
                                 ))
                                 .ToList()
                         ))
                    .ToList(),
                     rr.ResourceRequestImplementation != null ?
                     new ResourceRequestImplementationDTO
                     (
                         rr.ResourceRequestImplementation.Id,
                         rr.ResourceRequestImplementation.ResourceRequestId,
                         rr.ResourceRequestImplementation.AcceptedAt,
                         rr.ResourceRequestImplementation.AccomplishedAt,
                         rr.ResourceRequestImplementation.EmployeeId,
                         rr.ResourceRequestImplementation.Status,
                         rr.ResourceRequestImplementation.DelayReason,
                         rr.ResourceRequestImplementation.DelayedAt,
                         rr.ResourceRequestImplementation.CreatedAt,
                         rr.ResourceRequestImplementation.UpdatedAt
                     ) : null,
                     rr.CreatedAt
            );
        }
    }
}
