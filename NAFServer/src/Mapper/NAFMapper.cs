using NAFServer.src.Application.DTOs.Employee;
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.DTOs.ResourceRequestApprovalStep;
using NAFServer.src.Application.DTOs.ResourceRequestApprovalStepHistory;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Mapper.Helper;

public static class NAFMapper
{
    public static NAFDTO ToDTO(NAF naf, Employee emp)
    {
        return new NAFDTO(
            naf.Id,
            naf.Reference,
            naf.RequestorId,
            new EmployeeDTO(
                emp.Id,
                emp.FirstName,
                emp.MiddleName,
                emp.LastName,
                emp.Status,
                emp.Company,
                emp.HiredDate,
                emp.RegularizedDate,
                emp.SeparatedDate,
                emp.Position,
                emp.Location,
                emp.SupervisorId,
                emp.DepartmentHeadId,
                emp.DepartmentId,
                emp.DepartmentDesc
            ),
            naf.AccomplishedAt,
            naf.SubmittedAt,
            naf.Progress,
            naf.CreatedAt,
            naf.UpdatedAt,
            naf.DepartmentId,
            naf.ResourceRequests.Select(rr =>
            {

                return new ResourceRequestDTO(
                    rr.Id,
                    rr.CurrentStep,
                    rr.Progress,
                    rr.AccomplishedAt,
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
                     rr.AdditionalInfo != null
                    ? AdditionalInfoMapper.MapAdditionalInfo(rr.AdditionalInfo)
                    : null,
                    rr.ResourceRequestPurposes.Select(p => new ResourceRequestPurposeDTO(
                        p.Id,
                        p.Purpose,
                        p.ResourceRequestId,
                        p.ResourceRequestApprovalStepHistoryId,
                        p.CreatedAt
                    )).ToList(),
                    rr.ResourceRequestsApprovalSteps.Select(s => new ResourceRequestApprovalStepDTO(
                        s.Id,
                        s.ResourceRequestId,
                        s.StepOrder,
                        s.ApproverId,
                        s.Progress,
                        s.ApprovedAt,
                        s.Histories.Select(h => new ResourceRequestApprovalStepHistoryDTO(
                            h.Id,
                            h.Status,
                            h.Comment,
                            h.ReasonForRejection,
                            h.ActionAt,
                            h.ResourceRequestApprovalStepId
                        )).ToList()
                    )).ToList(),
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
            }).ToList()
        );
    }
}