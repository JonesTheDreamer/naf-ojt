export enum RoutesEnum {
  // Login routes
  LOGIN_REQUESTOR = "/login",
  LOGIN_ADMIN = "/login/admin",
  LOGIN_TECH = "/login/tech",

  // Requestor/Approver routes
  NAF = "/NAF",

  // Admin routes
  ADMIN = "/admin",
  ADMIN_FOR_IMPLEMENTATIONS = "/admin/for-implementations",
  ADMIN_NAF = "/admin/NAF",
  ADMIN_NAF_DETAIL = "/admin/NAF/:nafId",
  ADMIN_IMPLEMENTATION_DETAIL = "/admin/for-implementations/:nafId",
  ADMIN_USERS = "/admin/users",
  ADMIN_USER_DETAIL = "/admin/users/:userId",
  ADMIN_RESOURCES = "/admin/resources",
  ADMIN_RESOURCE_DETAIL = "/admin/resources/:resourceId",

  // Technical Team routes
  TECH = "/tech",
  TECH_MY_TASKS = "/tech/my-tasks",
  // TECH_FOR_IMPLEMENTATIONS = "/tech/for-implementations",
}
