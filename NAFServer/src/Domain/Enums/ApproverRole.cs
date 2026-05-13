namespace NAFServer.src.Domain.Enums
{
    public enum ApproverRole
    {
        SUPERVISOR,          // Employee's direct supervisor
        DEPARTMENT_HEAD,     // Dept head — ApproverEntity: null = employee's own dept, dept Code = specific dept
        SPECIFIC_EMPLOYEE,   // Fixed approver — ApproverEntity: employee ID
        ROLE_BASED,          // Any user with a given role — ApproverEntity: role name (ADMIN, HR, etc.)
        TECHNICAL_HEAD,      // Network admin at employee's location
    }
}
