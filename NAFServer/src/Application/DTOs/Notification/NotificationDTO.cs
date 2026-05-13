namespace NAFServer.src.Application.DTOs.Notification
{
    public record NotificationDTO(
        Guid Id,
        string Title,
        string Message,
        string Link,
        string Entity,
        bool IsRead,
        DateTime CreatedAt
    );
}
