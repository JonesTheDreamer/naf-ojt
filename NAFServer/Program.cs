using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Application.Handlers.ResourceRequestHandler;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Application.Services;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Infrastructure.Persistence.Repositories;
using NAFServer.src.Infrastructure.Persistence.Seeder;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend",
        policy => policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IResourceRequestService, ResourceRequestService>();
builder.Services.AddScoped<INAFService, NAFService>();
builder.Services.AddScoped<IResourceRequestApprovalStepService, ResourceRequestApprovalStepService>();
builder.Services.AddScoped<IResourceRequestStepRepository, ResourceRequestStepRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<INAFRepository, NAFRepository>();
builder.Services.AddScoped<IApprovalWorkflowTemplateRepository, ApprovalWorkflowTemplateRepository>();
builder.Services.AddScoped<IApprovalWorkflowStepsTemplateRepository, ApprovalWorkflowStepsTemplateRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
//builder.Services.AddScoped<IResourceRequestApprovalStepRepository, ResourceRequestApprovalStepRepository>();
builder.Services.AddScoped<IResourceRequestStepHistoryRepository, ResourceRequestStepHistoryRepository>();
builder.Services.AddScoped<IResourceRequestRepository, ResourceRequestRepository>();
builder.Services.AddScoped<IResourceRequestHandler, InternetRequestHandler>();
builder.Services.AddScoped<IResourceRequestHandler, SharedFolderRequestHandler>();
builder.Services.AddScoped<IResourceRequestHandler, GroupEmailRequestHandler>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<IInternetResourceRepository, InternetResourceRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();

builder.Services.AddScoped<IResourceRequestHandlerRegistry, ResourceRequestHandlerRegistry>();
builder.Services.AddScoped<IImplementationRepository, ImplementationRepository>();
builder.Services.AddScoped<IImplementationService, ImplementationService>();
builder.Services.AddScoped<IResourceRequestHandlerRegistry, ResourceRequestHandlerRegistry>();

builder.Services.AddMemoryCache();
builder.Services.AddSingleton<CacheService>();

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

var app = builder.Build();

//Seed database
using (var scope = app.Services.CreateScope())
{
    var serviceProvider = scope.ServiceProvider;
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    //context.Database.Migrate();
    await ResourceWorkflowSeeder.SeedAsync(context);
    await SharedFolderSeeder.SeedAsync(context);
    await InternetResourceSeeder.SeedAsync(context);
}

//using (var scope = app.Services.CreateScope())
//{
//    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//    // WARNING: Drops entire DB
//    context.Database.EnsureDeleted();
//    // Reseed
//    //await ResourceWorkflowSeeder.SeedAsync(context);
//}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();
app.UseCors("Frontend");

app.MapControllers();

app.Run();
