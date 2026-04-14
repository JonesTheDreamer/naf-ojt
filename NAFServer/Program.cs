using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Handlers.ResourceRequestHandler;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Application.Services;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Infrastructure.Persistence.Repositories;
using NAFServer.src.Infrastructure.Persistence.Seeder;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend",
        policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["auth_token"];
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddScoped<IResourceRequestService, ResourceRequestService>();
builder.Services.AddScoped<INAFService, NAFService>();
builder.Services.AddScoped<IResourceRequestApprovalStepService, ResourceRequestApprovalStepService>();
builder.Services.AddScoped<IResourceRequestStepRepository, ResourceRequestStepRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<INAFRepository, NAFRepository>();
builder.Services.AddScoped<IApprovalWorkflowTemplateRepository, ApprovalWorkflowTemplateRepository>();
builder.Services.AddScoped<IApprovalWorkflowStepsTemplateRepository, ApprovalWorkflowStepsTemplateRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IResourceRequestStepHistoryRepository, ResourceRequestStepHistoryRepository>();
builder.Services.AddScoped<IResourceRequestRepository, ResourceRequestRepository>();
builder.Services.AddScoped<IResourceRequestHandler, InternetRequestHandler>();
builder.Services.AddScoped<IResourceRequestHandler, SharedFolderRequestHandler>();
builder.Services.AddScoped<IResourceRequestHandler, GroupEmailRequestHandler>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<IInternetResourceRepository, InternetResourceRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IInternetPurposeRepository, InternetPurposeRepository>();
builder.Services.AddScoped<IGroupEmailRepository, GroupEmailRepository>();
builder.Services.AddScoped<ISharedFolderRepository, SharedFolderRepository>();
builder.Services.AddScoped<IInternetPurposeService, InternetPurposeService>();
builder.Services.AddScoped<IInternetResourceService, InternetResourceService>();
builder.Services.AddScoped<IGroupEmailService, GroupEmailService>();
builder.Services.AddScoped<ISharedFolderService, SharedFolderService>();
builder.Services.AddScoped<IResourceRequestHandlerRegistry, ResourceRequestHandlerRegistry>();
builder.Services.AddScoped<IImplementationRepository, ImplementationRepository>();
builder.Services.AddScoped<IImplementationService, ImplementationService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<CacheService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await EmployeeDepartmentSeeder.SeedAsync(context);
    await ResourceWorkflowSeeder.SeedAsync(context);
    await SharedFolderSeeder.SeedAsync(context);
    await InternetResourceSeeder.SeedAsync(context);
    await UserSeeder.SeedAsync(context);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
