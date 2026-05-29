using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;
namespace NAFServer.src.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<Resource> Resources { get; set; }
        public DbSet<ApprovalWorkflowTemplate> ApprovalWorkflowTemplates { get; set; }
        public DbSet<ResourceRequest> ResourceRequests { get; set; }
        public DbSet<NAF> NAFs { get; set; }
        public DbSet<ApprovalWorkflowStepsTemplate> ApprovalWorkflowStepsTemplates { get; set; }
        public DbSet<ResourceRequestApprovalStep> ResourceRequestApprovalSteps { get; set; }
        public DbSet<ResourceRequestApprovalStepHistory> ResourceRequestApprovalStepHistories { get; set; }
        public DbSet<ResourceRequestPurpose> ResourceRequestPurposes { get; set; }
        public DbSet<SharedFolder> SharedFolders { get; set; }
        public DbSet<GroupEmail> GroupEmails { get; set; }
        public DbSet<ResourceRequestAdditionalInfo> AdditionalInfo { get; set; }
        public DbSet<InternetRequestInfo> InternetRequestInfos { get; set; }
        public DbSet<InternetPurpose> InternetPurposes { get; set; }
        public DbSet<InternetResource> InternetResources { get; set; }
        public DbSet<SharedFolderRequestInfo> SharedFolderRequestInfos { get; set; }
        public DbSet<GroupEmailRequestInfo> GroupEmailRequestInfos { get; set; }
        public DbSet<ResourceRequestImplementation> Implementations { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<ResourceRequestHistory> ResourceRequestHistories { get; set; }
        public DbSet<ResourceGroup> ResourceGroups { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Department> DepartmentViews { get; set; }
        public DbSet<ResourceRequestAllowance> ResourceRequestAllowances { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditTrail> AuditTrails { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                var idProperty = entityType.FindProperty("Id");

                if (idProperty != null &&
                    idProperty.ClrType == typeof(Guid) &&
                    idProperty.IsPrimaryKey())
                {
                    idProperty.ValueGenerated = Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.OnAdd;

                    idProperty.SetDefaultValueSql("NEWSEQUENTIALID()");
                }
            }

            // Mark all DateTime columns as UTC when read back from SQL Server.
            // SQL Server has no timezone info, so EF Core reads DateTimeKind.Unspecified.
            // Without this, System.Text.Json omits the 'Z' suffix and browsers misinterpret
            // the values as local time instead of UTC.
            var utcConverter = new ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            var nullableUtcConverter = new ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v : v.Value.ToUniversalTime()) : v,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                        property.SetValueConverter(utcConverter);
                    else if (property.ClrType == typeof(DateTime?))
                        property.SetValueConverter(nullableUtcConverter);
                }
            }

            modelBuilder.Entity<ResourceRequestAdditionalInfo>()
                .HasDiscriminator<string>("AdditionalInfoType")
                .HasValue<InternetRequestInfo>("Internet")
                .HasValue<SharedFolderRequestInfo>("SharedFolder")
                .HasValue<GroupEmailRequestInfo>("GroupEmail");


            modelBuilder.Entity<ResourceRequest>()
                .HasOne(r => r.AdditionalInfo)
                .WithOne(a => a.ResourceRequest)
                .HasForeignKey<ResourceRequestAdditionalInfo>(a => a.ResourceRequestId);

            // ResourceRequest -> NAF
            modelBuilder.Entity<ResourceRequest>()
                .HasOne(rr => rr.NAF)
                .WithMany(n => n.ResourceRequests)
                .HasForeignKey(rr => rr.NAFId)
                .OnDelete(DeleteBehavior.Cascade);

            // ResourceRequest -> Resource
            modelBuilder.Entity<ResourceRequest>()
                .HasOne(rr => rr.Resource)
                .WithMany(r => r.ResourceRequests) // add navigation to Resource
                .HasForeignKey(rr => rr.ResourceId)
                .OnDelete(DeleteBehavior.Restrict); // disable cascade

            // ResourceRequest -> ApprovalWorkflowTemplate
            modelBuilder.Entity<ResourceRequest>()
                .HasOne(rr => rr.ApprovalWorkflowTemplate)
                .WithMany(a => a.ResourceRequests) // add navigation if possible
                .HasForeignKey(rr => rr.ApprovalWorkflowTemplateId)
                .OnDelete(DeleteBehavior.Restrict); // disable cascade

            // ResourceRequest -> ResourceRequestApprovalSteps
            modelBuilder.Entity<ResourceRequestApprovalStep>()
                .HasOne(ras => ras.ResourceRequest)
                .WithMany(rr => rr.ResourceRequestsApprovalSteps)
                .HasForeignKey(ras => ras.ResourceRequestId)
                .OnDelete(DeleteBehavior.Restrict); // avoid cascade

            modelBuilder.Entity<ResourceRequestApprovalStep>()
                .HasMany(s => s.Histories)
                .WithOne(h => h.ResourceRequestApprovalStep)
                .HasForeignKey(h => h.ResourceRequestApprovalStepId)
                .IsRequired();

            modelBuilder.Entity<ApprovalWorkflowStepsTemplate>()
                .Property(s => s.StepAction)
                .HasConversion<string>();

            modelBuilder.Entity<ApprovalWorkflowStepsTemplate>()
                .Property(s => s.ApproverRole)
                .HasConversion<string>();

            modelBuilder.Entity<NAF>()
                .HasOne(n => n.Location)
                .WithMany(l => l.NAFs)
                .HasForeignKey(n => n.LocationId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<NAF>()
                .Property(n => n.Progress)
                .HasConversion<string>();

            modelBuilder.Entity<ResourceRequest>()
                .Property(rr => rr.Progress)
                .HasConversion<string>();

            modelBuilder.Entity<ResourceRequestApprovalStep>()
                .Property(rras => rras.Progress)
                .HasConversion<string>();

            modelBuilder.Entity<ResourceRequestApprovalStepHistory>()
                .Property(rras => rras.Status)
                .HasConversion<string>();

            modelBuilder.Entity<ResourceRequestHistory>()
                .Property(rrh => rrh.Type)
                .HasConversion<string>();

            modelBuilder.Entity<ResourceRequestImplementation>()
                .Property(rri => rri.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Role>()
                .Property(r => r.Name)
                .HasConversion<string>();

            modelBuilder.Entity<User>()
                .HasMany(u => u.UserRoles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SharedFolder>()
                .Property(sf => sf.IsActive)
                .HasDefaultValue(true);

            // Employee view (keyless)
            modelBuilder.Entity<Employee>()
                .HasNoKey()
                .ToView("vw_EmployeeDetails");

            modelBuilder.Entity<Employee>()
                .Property(e => e.Id).HasColumnName("EmployeeNumber");

            modelBuilder.Entity<Employee>()
                .Property(e => e.DepartmentId).HasColumnName("DepartmentCode");

            // DepartmentView (keyless)
            modelBuilder.Entity<Department>()
                .HasNoKey()
                .ToView("vw_DepartmentDetails");

            modelBuilder.Entity<Department>()
                .Property(d => d.Id).HasColumnName("DepartmentId");

            // ResourceRequestAllowance
            modelBuilder.Entity<ResourceRequestAllowance>()
                .HasOne(a => a.Resource)
                .WithMany()
                .HasForeignKey(a => a.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResourceRequestAllowance>()
                .HasOne(a => a.Location)
                .WithMany()
                .HasForeignKey(a => a.LocationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResourceRequestAllowance>()
                .HasIndex(a => new { a.ResourceId, a.LocationId })
                .IsUnique();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            //var userId = _currentUser.UserId ?? "system";

            foreach (var entry in ChangeTracker.Entries<TimeStamp>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.SetCreated();
                        break;

                    case EntityState.Modified:
                        entry.Entity.SetUpdated();
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }

    }
}
