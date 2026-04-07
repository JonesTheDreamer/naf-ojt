using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence.Repositories.Helper;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class NAFRepository : INAFRepository
    {
        private readonly AppDbContext _context;
        private readonly IEmployeeRepository _employeeRepository;

        public NAFRepository(AppDbContext context, IEmployeeRepository employeeRepository)
        {
            _context = context;
            _employeeRepository = employeeRepository;
        }

        public async Task<NAF> GetByIdAsync(Guid nafId)
        {
            return await _context.NAFs
                    .Where(n => n.Id == nafId)
                    .IncludeResourceRequestsWithAdditionalInfo()
                    .FirstOrDefaultAsync()
                    ?? throw new KeyNotFoundException("NAF not found");
        }

        public async Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, string departmentId)
        {
            return await _context.NAFs
                .AnyAsync(n => n.EmployeeId == employeeId
                && n.DepartmentId == departmentId);
        }

        public async Task<List<NAFDTO>> GetByEmployeeIdAsync(string employeeId)
        {
            var nafs = await _context.NAFs
                .IncludeResourceRequestsWithAdditionalInfo()
                .Where(n => n.EmployeeId == employeeId)
                .ToListAsync();
            var employee = await _employeeRepository.GetByIdAsync(employeeId);

            return nafs.Select(naf => NAFMapper.ToDTO(naf, employee)).ToList();
        }

        public async Task<PagedResult<NAFDTO>> GetNAFUnderEmployee(string employeeId, int page)
        {
            int pageSize = 6;

            var employees = await _employeeRepository.GetEmployeeSubordinates(employeeId);
            if (employees == null || !employees.Any())
            {
                return new PagedResult<NAFDTO>
                {
                    Data = new List<NAFDTO>(),
                    TotalCount = 0,
                    PageSize = pageSize,
                    CurrentPage = page,
                    TotalPages = 0
                };
            }

            var employeeIds = employees.Select(e => e.Id).ToList();

            // Base query (IMPORTANT: no Skip/Take here)
            var query = _context.NAFs
                .Where(n => employeeIds.Contains(n.EmployeeId));

            // 1. Get total count (efficient SQL COUNT(*))
            var totalCount = await query.CountAsync();

            // 2. Apply pagination
            int skip = (page - 1) * pageSize;

            var nafs = await query
                .OrderByDescending(n => n.SubmittedAt)
                .IncludeResourceRequestsWithAdditionalInfo()
                .Skip(skip)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            // 3. Mapping
            var employeeLookup = employees.ToDictionary(e => e.Id);

            var nafDTOs = new List<NAFDTO>();

            foreach (var naf in nafs)
            {
                if (!employeeLookup.TryGetValue(naf.EmployeeId, out var employee))
                    continue;

                var dto = NAFMapper.ToDTO(naf, employee);
                nafDTOs.Add(dto);
            }

            // 4. Compute total pages
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new PagedResult<NAFDTO>
            {
                Data = nafDTOs,
                TotalCount = totalCount,
                PageSize = pageSize,
                CurrentPage = page,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResult<NAFDTO>> GetNAFToApprove(string employeeId, int page)
        {
            int pageSize = 6;

            if (string.IsNullOrEmpty(employeeId))
            {
                return new PagedResult<NAFDTO>
                {
                    Data = new List<NAFDTO>(),
                    TotalCount = 0,
                    PageSize = pageSize,
                    CurrentPage = page,
                    TotalPages = 0
                };
            }

            int skip = (page - 1) * pageSize;

            // STEP 1: Base query (NAF level)
            var nafQuery = _context.NAFs
                .Where(n => n.ResourceRequests
                    .Any(rr => rr.ResourceRequestsApprovalSteps
                        .Any(step => step.ApproverId == employeeId)));

            // STEP 2: Total count
            var totalCount = await nafQuery.CountAsync();

            // STEP 3: Fetch paginated NAFs with standard includes
            var pagedNAFs = await nafQuery
                .OrderByDescending(n => n.SubmittedAt)
                .Skip(skip)
                .Take(pageSize)
                .Include(n => n.ResourceRequests)
                    .ThenInclude(rr => rr.Resource)
                .Include(n => n.ResourceRequests)
                    .ThenInclude(rr => rr.ResourceRequestPurposes)
                .Include(n => n.ResourceRequests)
                    .ThenInclude(rr => rr.ResourceRequestsApprovalSteps)
                        .ThenInclude(step => step.Histories)
                .AsNoTracking()
                .ToListAsync();

            // STEP 4: Load polymorphic AdditionalInfo safely (separate queries)

            var rrIds = pagedNAFs
                .SelectMany(n => n.ResourceRequests)
                .Select(rr => rr.Id)
                .ToList();

            if (rrIds.Any())
            {
                // Internet
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is InternetRequestInfo)
                    .Include(rr => ((InternetRequestInfo)rr.AdditionalInfo).InternetResource)
                        .ThenInclude(ir => ir.Purpose)
                    .LoadAsync();

                // Shared Folder
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is SharedFolderRequestInfo)
                    .Include(rr => ((SharedFolderRequestInfo)rr.AdditionalInfo).SharedFolder)
                    .LoadAsync();

                // Group Email
                await _context.ResourceRequests
                    .Where(rr => rrIds.Contains(rr.Id) && rr.AdditionalInfo is GroupEmailRequestInfo)
                    .Include(rr => ((GroupEmailRequestInfo)rr.AdditionalInfo).GroupEmail)
                    .LoadAsync();
            }

            // STEP 5: Batch load employees (avoid N+1)
            var employeeIds = pagedNAFs
                .Select(n => n.EmployeeId)
                .Distinct()
                .ToList();

            var employees = new List<Employee>();

            foreach (var id in employeeIds)
            {
                var employee = await _employeeRepository.GetByIdAsync(id);
                if (employee != null) employees.Add(employee);
            }

            var employeeLookup = employees.ToDictionary(e => e.Id);

            // STEP 6: Map to DTOs
            var nafDTOs = new List<NAFDTO>();

            foreach (var naf in pagedNAFs)
            {
                if (!employeeLookup.TryGetValue(naf.EmployeeId, out var employee))
                    continue;

                nafDTOs.Add(NAFMapper.ToDTO(naf, employee));
            }

            // STEP 7: Compute total pages
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new PagedResult<NAFDTO>
            {
                Data = nafDTOs,
                TotalCount = totalCount,
                PageSize = pageSize,
                CurrentPage = page,
                TotalPages = totalPages
            };
        }
    }
}
