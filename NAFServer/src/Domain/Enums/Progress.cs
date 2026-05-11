namespace NAFServer.src.Domain.Enums
{
    public enum Progress
    {
        OPEN,           // 0 — no approvers yet
        IN_PROGRESS,    // 1 — waiting for next approver
        FOR_SCREENING,  // 2 — awaiting technical screening
        IMPLEMENTATION, // 3 — technical team is working on it
        ACCOMPLISHED,   // 4 — delivered
        REJECTED,       // 5 — an approver rejected
        NOT_ACCOMPLISHED, // 6 — requestor closed a rejected request
        CANCELLED       // 7 — cancelled
    }
}
