using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NAFServer.src.Application.DTOs.ResourceManagement;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class ResourceManagementService : IResourceManagementService
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ResourceManagementService> _logger;

        public ResourceManagementService(AppDbContext context, IEmployeeRepository employeeRepository, INotificationService notificationService, ILogger<ResourceManagementService> logger)
        {
            _context = context;
            _employeeRepository = employeeRepository;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<List<AdminResourceListItemDTO>> GetAllResourcesAsync()
        {
            var resources = await _context.Resources
                .Include(r => r.ResourceGroup)
                .OrderByDescending(r => r.IsActive)
                .ThenBy(r => r.Name)
                .ToListAsync();

            var activeTemplates = await _context.ApprovalWorkflowTemplates
                .Where(t => t.IsActive)
                .ToDictionaryAsync(t => t.ResourceId, t => t.Version);

            return resources.Select(r => new AdminResourceListItemDTO(
                r.Id,
                r.Name,
                r.IconUrl,
                r.Color,
                r.IsActive,
                r.IsSpecial,
                r.ResourceGroup?.Name,
                r.IsSpecial && activeTemplates.TryGetValue(r.Id, out var v) ? v : 0
            )).ToList();
        }

        public async Task<AdminResourceDetailDTO> GetResourceDetailAsync(int id)
        {
            var resource = await _context.Resources
                .Include(r => r.ResourceGroup)
                .FirstOrDefaultAsync(r => r.Id == id)
                ?? throw new KeyNotFoundException($"Resource {id} not found");

            var templates = await _context.ApprovalWorkflowTemplates
                .Where(t => t.ResourceId == id)
                .OrderBy(t => t.Version)
                .ToListAsync();

            var templateIds = templates.Select(t => t.Id).ToList();
            var allSteps = await _context.ApprovalWorkflowStepsTemplates
                .Where(s => templateIds.Contains(s.ApprovalWorkflowTemplateId))
                .OrderBy(s => s.StepOrder)
                .ToListAsync();

            var workflowVersions = templates.Select(t => new WorkflowTemplateVersionDTO(
                t.Id,
                t.Version,
                t.IsActive,
                allSteps
                    .Where(s => s.ApprovalWorkflowTemplateId == t.Id)
                    .Select(s => new WorkflowStepDTO(s.StepOrder, s.StepAction.ToString(), s.ApproverRole.ToString(), s.ApproverEntity))
                    .ToList()
            )).ToList();

            var activeProgress = new[] { Progress.OPEN, Progress.IN_PROGRESS, Progress.FOR_SCREENING, Progress.IMPLEMENTATION };
            var requests = await _context.ResourceRequests
                .Where(rr => rr.ResourceId == id)
                .Include(rr => rr.NAF)
                .ThenInclude(n => n.Location)
                .ToListAsync();

            var employeeIds = requests.Select(rr => rr.NAF.EmployeeId).Distinct().ToList();
            var employees = new Dictionary<string, Employee>();
            foreach (var eid in employeeIds)
            {
                var emp = await _employeeRepository.GetByIdAsync(eid);
                if (emp != null)
                    employees[eid] = emp;
            }

            var byLocation = requests
                .GroupBy(rr => rr.NAF.LocationId)
                .Select(g =>
                {
                    var locationName = g.First().NAF.Location?.Name ?? "Unknown";
                    var emps = g.Select(rr =>
                    {
                        employees.TryGetValue(rr.NAF.EmployeeId, out var emp);
                        var nameParts = new List<string?> { emp?.FirstName, emp?.MiddleName != null ? emp.MiddleName[0] + "." : null, emp?.LastName };
                        var name = emp != null
                            ? string.Join(" ", nameParts.Where(p => p != null))
                            : rr.NAF.EmployeeId;
                        return new EmployeeResourceRequestItemDTO(rr.NAF.EmployeeId, name, rr.NAFId, rr.Id, rr.Progress.ToString());
                    }).ToList();
                    return new EmployeesByLocationDTO(g.Key, locationName, emps);
                })
                .OrderBy(l => l.LocationName)
                .ToList();

            return new AdminResourceDetailDTO(
                resource.Id, resource.Name, resource.IconUrl, resource.Color,
                resource.IsActive, resource.IsSpecial, resource.ResourceGroupId,
                resource.ResourceGroup?.Name, workflowVersions, byLocation
            );
        }

        public async Task<int> CreateResourceAsync(CreateResourceDTO dto)
        {
            if (dto.IsSpecial && (dto.Steps == null || dto.Steps.Count == 0))
                throw new ArgumentException("Special resources require at least one workflow step.");

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var resource = new Resource(dto.Name, dto.Color, null, dto.IsSpecial, false);
                if (dto.ResourceGroupId.HasValue)
                    resource.AssignToGroup(dto.ResourceGroupId.Value);

                _context.Resources.Add(resource);
                await _context.SaveChangesAsync();

                if (dto.IsSpecial)
                {
                    var template = new ApprovalWorkflowTemplate(resource.Id, 1);
                    _context.ApprovalWorkflowTemplates.Add(template);
                    await _context.SaveChangesAsync();

                    _context.ApprovalWorkflowStepsTemplates.AddRange(BuildSteps(template.Id, dto.Steps!));
                    await _context.SaveChangesAsync();
                }

                await tx.CommitAsync();

                // Notify all admins about new resource
                try
                {
                    var adminIds = await _notificationService.GetAllAdminsAsync();
                    if (adminIds.Count > 0)
                    {
                        await _notificationService.CreateForUsersAsync(
                            adminIds,
                            "New Resource Added",
                            $"A new resource has been added to the system.",
                            $"/admin/resources/{resource.Id}"
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send notification for new resource {ResourceId}", resource.Id);
                }

                return resource.Id;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task DeactivateResourceAsync(int id)
        {
            var resource = await _context.Resources.FindAsync(id)
                ?? throw new KeyNotFoundException($"Resource {id} not found");

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                resource.SetToInactive();
                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task AddWorkflowTemplateAsync(int resourceId, AddWorkflowTemplateDTO dto)
        {
            if (dto.Steps == null || dto.Steps.Count == 0)
                throw new ArgumentException("At least one step is required.");

            var resource = await _context.Resources.FindAsync(resourceId)
                ?? throw new KeyNotFoundException($"Resource {resourceId} not found");

            if (!resource.IsSpecial)
                throw new InvalidOperationException("Cannot add workflow templates to non-special resources.");

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var current = await _context.ApprovalWorkflowTemplates
                    .Where(t => t.ResourceId == resourceId && t.IsActive)
                    .FirstOrDefaultAsync();
                current?.SetToInactive();

                var maxVersion = await _context.ApprovalWorkflowTemplates
                    .Where(t => t.ResourceId == resourceId)
                    .MaxAsync(t => (int?)t.Version) ?? 0;

                var template = new ApprovalWorkflowTemplate(resourceId, maxVersion + 1);
                _context.ApprovalWorkflowTemplates.Add(template);
                await _context.SaveChangesAsync();

                _context.ApprovalWorkflowStepsTemplates.AddRange(BuildSteps(template.Id, dto.Steps));
                await _context.SaveChangesAsync();

                await tx.CommitAsync();

                // Notify all admins about workflow template change
                try
                {
                    var adminIds = await _notificationService.GetAllAdminsAsync();
                    if (adminIds.Count > 0)
                    {
                        await _notificationService.CreateForUsersAsync(
                            adminIds,
                            "Resource Workflow Updated",
                            $"An approval workflow has been updated.",
                            $"/admin/resources/{resourceId}"
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send notification for workflow update on resource {ResourceId}", resourceId);
                }
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
        private static List<ApprovalWorkflowStepsTemplate> BuildSteps(Guid templateId, List<CreateWorkflowStepDTO> steps)
        {
            return steps.Select(s =>
            {
                if (!Enum.TryParse<StepAction>(s.StepAction, out var stepAction))
                    throw new ArgumentException($"Invalid StepAction: '{s.StepAction}'. Valid values: {string.Join(", ", Enum.GetNames<StepAction>())}");
                if (!Enum.TryParse<ApproverRole>(s.ApproverRole, out var approverRole))
                    throw new ArgumentException($"Invalid ApproverRole: '{s.ApproverRole}'. Valid values: {string.Join(", ", Enum.GetNames<ApproverRole>())}");
                return new ApprovalWorkflowStepsTemplate(templateId, s.StepOrder, stepAction, approverRole, s.ApproverEntity);
            }).ToList();
        }
    }
}
