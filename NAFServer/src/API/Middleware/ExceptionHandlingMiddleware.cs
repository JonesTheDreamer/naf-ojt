using System.Text.Json;
using NAFServer.src.Domain.Exceptions;

namespace NAFServer.src.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            int statusCode;
            string message;

            switch (ex)
            {
                case KeyNotFoundException:
                    statusCode = StatusCodes.Status404NotFound;
                    message = ex.Message;
                    break;
                case ArgumentException:
                case ApplicationException:
                case DomainException:
                case InvalidOperationException:
                    statusCode = StatusCodes.Status400BadRequest;
                    message = ex.Message;
                    break;
                case UnauthorizedAccessException:
                    statusCode = StatusCodes.Status403Forbidden;
                    message = "Access denied.";
                    break;
                default:
                    statusCode = StatusCodes.Status500InternalServerError;
                    message = "An unexpected error occurred.";
                    break;
            }

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var body = JsonSerializer.Serialize(new { error = message });
            await context.Response.WriteAsync(body);
        }
    }
}
