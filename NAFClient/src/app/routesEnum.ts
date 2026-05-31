export enum RoutesEnum {
  LOGIN = "/login",

  NAF = "/NAF",

  ADMIN = "/admin",
  ADMIN_NAF = "/admin/NAF",
  ADMIN_NAF_DETAIL = "/admin/NAF/:nafId",
  ADMIN_USERS = "/admin/users",
  ADMIN_USER_DETAIL = "/admin/users/:userId",
  ADMIN_RESOURCES = "/admin/resources",
  ADMIN_RESOURCE_DETAIL = "/admin/resources/:resourceId",
  ADMIN_RESOURCE_REQUESTS = "/admin/resource-requests",
  ADMIN_DEPARTMENTS = "/admin/departments",
  ADMIN_DEPARTMENT_DETAIL = "/admin/departments/:departmentId",
  ADMIN_AUDIT_TRAIL = "/admin/audit-trail",
  ADMIN_SHARED_FOLDERS = "/admin/resources/shared-folders",
  ADMIN_SHARED_FOLDER_DETAIL = "/admin/resources/shared-folders/:id",

  HR = "/hr",
  HR_CREATE = "/hr/create",

  SOC = "/soc",
  SOC_NAF_DETAIL = "/soc/NAF/:nafId",
}
