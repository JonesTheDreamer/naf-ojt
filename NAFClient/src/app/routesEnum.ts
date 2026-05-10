export enum RoutesEnum {
  // Login
  LOGIN = "/login",

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
}
