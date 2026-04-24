using Microsoft.EntityFrameworkCore;
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
        public DbSet<Department> Departments { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<UserLocation> UserLocations { get; set; }
        public DbSet<UserDepartment> UserDepartments { get; set; }
        public DbSet<ResourceRequestHistory> ResourceRequestHistories { get; set; }
        public DbSet<ResourceGroup> ResourceGroups { get; set; }
        public DbSet<Location> Locations { get; set; }
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

            // Keyless entities
            //modelBuilder.Entity<Employee>().HasNoKey();
            //modelBuilder.Entity<Department>().HasNoKey(); temporarily

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

            modelBuilder.Entity<Employee>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToView("vw_EmployeeLinkPeopleCore");
            });

            modelBuilder.Entity<User>()
                .HasOne(u => u.Employee)
                .WithMany()
                .HasForeignKey(u => u.EmployeeNumber)
                .HasPrincipalKey(e => e.Id);

            modelBuilder.Entity<User>()
                .HasMany(u => u.UserRoles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.UserDepartments)
                .WithOne(ud => ud.User)
                .HasForeignKey(ud => ud.UserId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.UserLocations)
                .WithOne(ul => ul.User)
                .HasForeignKey(ul => ul.UserId);
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
