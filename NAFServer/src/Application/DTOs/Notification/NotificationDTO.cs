namespace NAFServer.src.Application.DTOs.Notification
{
    public record NotificationDTO(
        Guid Id,
        string Title,
        string Message,
        string Link,
        bool IsRead,
        DateTime CreatedAt
    );
}
