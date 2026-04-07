using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Domain.Entities
{
    public class ApprovalWorkflowStepsTemplate
    {
        public Guid Id { get; set; }
        public int StepOrder { get; set; }
        public StepAction StepAction { get; set; }
        public ApproverRole ApproverRole { get; set; }
        public string ApproverEntity { get; set; }

        public Guid ApprovalWorkflowTemplateId { get; set; }
        public ApprovalWorkflowTemplate ApprovalWorkflowTemplate { get; set; }

        private ApprovalWorkflowStepsTemplate() { }
        public ApprovalWorkflowStepsTemplate(Guid ApprovalWorkflowTemplateId, int StepOrder, StepAction StepAction, ApproverRole ApproverRole, string ApproverEntity)
        {
            this.ApprovalWorkflowTemplateId = ApprovalWorkflowTemplateId;
            this.StepOrder = StepOrder;
            this.StepAction = StepAction;
            this.ApproverRole = ApproverRole;
            this.ApproverEntity = ApproverEntity;
        }
    }
}
