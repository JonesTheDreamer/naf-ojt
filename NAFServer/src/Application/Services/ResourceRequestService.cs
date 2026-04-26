using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;
using System.Text.Json;

namespace NAFServer.src.Application.Services
{
    public class ResourceRequestService : IResourceRequestService
    {
        private readonly AppDbContext _context;
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly INAFRepository _nafRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IApprovalWorkflowStepsTemplateRepository _approvalWorkflowStepsTemplateRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly IResourceRepository _resourceRepository;
        private readonly IApprovalWorkflowTemplateRepository _approvalWorkflowTemplateRepository;
        private readonly IResourceRequestHandlerRegistry _resourceRequestHandlerRegistry;
        private readonly IUserRepository _userRepository;
        private readonly IUserLocationRepository _userLocationRepository;

        public ResourceRequestService(
            IResourceRequestRepository resourceRequestRepository,
            INAFRepository nafRepository,
            IEmployeeRepository employeeRepository,
            IApprovalWorkflowStepsTemplateRepository approvalWorkflowStepsTemplateRepository,
            IDepartmentRepository departmentRepository,
            IResourceRepository resourceRepository,
            IApprovalWorkflowTemplateRepository approvalWorkflowTemplateRepository,
            IResourceRequestHandlerRegistry resourceRequestHandlerRegistry,
            IUserRepository userRepository,
            IUserLocationRepository userLocationRepository,
            AppDbContext context
        )
        {
            _resourceRequestRepository = resourceRequestRepository;
            _nafRepository = nafRepository;
            _employeeRepository = employeeRepository;
            _approvalWorkflowStepsTemplateRepository = approvalWorkflowStepsTemplateRepository;
            _departmentRepository = departmentRepository;
            _resourceRepository = resourceRepository;
            _approvalWorkflowTemplateRepository = approvalWorkflowTemplateRepository;
            _resourceRequestHandlerRegistry = resourceRequestHandlerRegistry;
            _userRepository = userRepository;
            _userLocationRepository = userLocationRepository;
            _context = context;
        }

        public async Task<ResourceRequestDTO> CreateSpecialAsync(CreateResourceRequestDTO request)
        {
            var resource = await _resourceRepository.GetResourceByIdAsync(request.resourceId);

            if (!resource.IsSpecial)
                throw new ArgumentException("Invalid Resource. Using CreateSpecialAsync for a basic resource.");

            var hasOuterTransaction = _context.Database.CurrentTransaction != null;

            await using var transaction = hasOuterTransaction
                ? null
                : await _context.Database.BeginTransactionAsync();

            try
            {
                var naf = await _nafRepository.GetByIdAsync(request.nafId);

                ResourceRequestAdditionalInfo? additionalInfo = null;

                // Only process additional info when required by resource
                if (resource.HasAdditionalInfo)
                {
                    if (request.additionalInfo is not JsonElement element)
                        throw new ApplicationException("Additional Info is required.");

                    var handler = _resourceRequestHandlerRegistry.GetHandler(request.resourceId);

                    additionalInfo = await handler.CreateAdditionalInfo(element);
                    additionalInfo.Id = Guid.NewGuid();

                    // Validate duplicates / business rules
                    bool isValid = await handler.Validate(additionalInfo, request.nafId);

                    if (!isValid)
                    {
                        throw new ApplicationException(
                            "Duplicate resource request: this resource is already requested in this NAF.");
                    }
                }

                var workflowId = await _approvalWorkflowTemplateRepository
                    .GetActiveWorkflowIdOfResourceAsync(request.resourceId);

                var rr = new ResourceRequest(
                    request.nafId,
                    request.resourceId,
                    workflowId,
                    request.dateNeeded,
                    additionalInfo,
                    Progress.OPEN
                );

                rr.NAF = naf;

                // Only assign navigation if additional info exists
                if (additionalInfo != null)
                {
                    additionalInfo.ResourceRequest = rr;
                }

                _context.ResourceRequests.Add(rr);

                await _context.SaveChangesAsync();

                var purpose = new ResourceRequestPurpose(
                    request.purpose,
                    rr.Id,
                    null
                );

                await _context.ResourceRequestPurposes.AddAsync(purpose);

                var approvers = await FetchApproversAsync(rr);

                if (approvers.Count > 0)
                {
                    await _context.ResourceRequestApprovalSteps.AddRangeAsync(approvers);
                }
                else
                {
                    rr.SetToAccomplished();
                }

                await _context.SaveChangesAsync();
                if (!hasOuterTransaction)
                {
                    await transaction.CommitAsync();
                }

                var saved = await _resourceRequestRepository.GetByIdAsync(rr.Id);

                return ResourceRequestMapper.ToDTO(saved);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ResourceRequestDTO> CreateBasicAsync(CreateResourceRequestDTO request)
        {
            try
            {
                var resource = await _resourceRepository.GetResourceByIdAsync(request.resourceId);
                if (resource.IsSpecial)
                {
                    throw new ArgumentException("Invalid Resource. Using Create Basic for special resource.");
                }

                var rr = new ResourceRequest(
                    request.nafId,
                    request.resourceId,
                    null,
                    request.dateNeeded,
                    null,
                    Progress.IMPLEMENTATION
                );
                //rr.DateNeeded = request.dateNeeded;
                //{
                //    Resource = resource
                //    //NAF = naf
                //}
                //;

                await _context.ResourceRequests.AddAsync(rr);
                await _context.SaveChangesAsync();
                await _context.Implementations.AddAsync(new Domain.Entities.ResourceRequestImplementation(rr.Id));
                await _context.SaveChangesAsync();
                rr.Resource = resource;
                return ResourceRequestMapper.ToDTO(rr);
            }
            catch (Exception ex)
            {
                throw new ArgumentException(ex.Message);
            }
        }

        public async Task<List<ResourceRequestApprovalStep>> FetchApproversAsync(ResourceRequest request)
        {
            var employee = await _employeeRepository.GetByIdAsync(request.NAF.EmployeeId);

            if (employee is null) throw new KeyNotFoundException();

            //var resource = await _resourceRepository.GetResourceByIdAsync(request.ResourceId);

            var steps = await _approvalWorkflowStepsTemplateRepository.GetTemplateStepsByResourceId(request.ResourceId);

            var approvers = new List<ResourceRequestApprovalStep>();

            foreach (var step in steps)
            {
                string? approverId = null;

                switch (step.ApproverRole)
                {
                    case ApproverRole.SUPERVISOR:
                        approverId = employee.SupervisorId;
                        break;

                    case ApproverRole.DEPARTMENT_HEAD:
                        approverId = step.ApproverEntity switch
                        {
                            "EMPLOYEE" => employee.DepartmentHeadId,
                            _ => (await _departmentRepository.GetByIdAsync(int.Parse(step.ApproverEntity)))
                            .DepartmentHeadId
                        };
                        break;
                    //case ApproverRole.POSITION:
                    //    approverId = step.ApproverEntity switch
                    //    {
                    //        "Network Admin" => "9229523",
                    //        //_ => (await _departmentRepository.GetByIdAsync(employee.DepartmentId))
                    //        //.PositionHeadId
                    //    };
                    //    break;
                    case ApproverRole.TECHNICAL_HEAD:
                        var user = await _userRepository.GetUserByEmployeeId(employee.Id);
                        var activeLocation = await _userLocationRepository.GetUserActiveLocation(user.Id);
                        var approver = await _userRepository.GetNetworkAdminOfLocation(activeLocation.LocationId);
                        approverId = step.ApproverEntity switch
                        {
                            "EMPLOYEE" => approver.EmployeeNumber
                        };
                        break;
                }

                if (approverId is not null)
                {
                    bool isExisting = approvers.Any(a => a.ApproverId == approverId);
                    if (!isExisting)
                    {
                        approvers.Add(new ResourceRequestApprovalStep(
                             request.Id,
                             approverId,
                             step.StepOrder
                         ));
                    }
                }
            }

            return approvers;
        }

        public async Task<ResourceRequestDTO> GetByIdAsync(Guid id)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(id);
            return ResourceRequestMapper.ToDTO(rr);
        }

        public async Task<ResourceRequestDTO> EditPurposeAsync(Guid requestId, EditPurposeDTO request)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            var currentStep = rr.ResourceRequestsApprovalSteps.FirstOrDefault(s => s.StepOrder == rr.CurrentStep)
                ?? throw new KeyNotFoundException("Step not found");

            if (rr.Progress != Progress.OPEN && currentStep.Progress != Progress.REJECTED)
                throw new InvalidOperationException("Purpose can only be edited if the request is still open / if an approver rejected requested");

            Guid? resourceRequestApprovalStepHistoryId = null;
            if (currentStep.Progress == Progress.REJECTED)
            {
                resourceRequestApprovalStepHistoryId = currentStep.Histories
                    .OrderByDescending(h => h.ActionAt)
                    .FirstOrDefault()
                    .Id;
                rr.SetToInProgress();
            }


            rr.EditPurpose(request.purpose, resourceRequestApprovalStepHistoryId);

            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.EDITED,
                "Resource request edited"
            ));

            await _context.SaveChangesAsync();
            return ResourceRequestMapper.ToDTO(rr);
        }

        public async Task<ResourceRequestDTO> ChangeResourceAsync(Guid requestId, int newResource)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            var resource = await _resourceRepository.GetResourceByIdAsync(newResource);

            if (!resource.IsActive)
            {
                throw new InvalidOperationException("Resource is inactive");
            }

            if (resource.HasAdditionalInfo)
            {
                throw new InvalidOperationException("Resources with additional information are not allowed to be changed or replace.");
            }

            if (rr.Resource.ResourceGroupId != resource.ResourceGroupId)
            {
                throw new InvalidOperationException("Can't change resource for request. Changing resource of a request requires the request to be on same group");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var dto = new CreateResourceRequestDTO
                (
                    rr.NAFId,
                    newResource,
                    $"Change from {rr.Resource.Name} to {resource.Name}",
                    null,
                    rr.DateNeeded
                );

                await DeleteAsync(requestId);
                ResourceRequestDTO toReturn = resource.IsSpecial
                    ? await CreateSpecialAsync(dto)
                    : await CreateBasicAsync(dto);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return toReturn;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception(ex.Message);
            }
        }

        public async Task CancelAsync(Guid requestId)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            rr.Cancel();
            await _context.ResourceRequestHistories.AddAsync(new ResourceRequestHistory
            (
                rr.Id,
                ResourceRequestAction.CANCELLED,
                "Resource request edited"
            ));

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid requestId)
        {
            var rr = await _resourceRequestRepository.GetByIdAsync(requestId);
            //if (rr.Progress != Progress.OPEN)
            //{
            //    throw new ArgumentException("Resource request can't be deleted");
            //}

            // Remove dependent entities first if cascade delete is not configured
            _context.ResourceRequestApprovalSteps.RemoveRange(rr.ResourceRequestsApprovalSteps);
            _context.ResourceRequestPurposes.RemoveRange(rr.ResourceRequestPurposes);

            _context.ResourceRequests.Remove(rr);

            await _context.SaveChangesAsync();

        }

    }
}
