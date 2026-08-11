REVOKE ALL ON FUNCTION public.has_workspace_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_business(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_work_leads(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_business(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_work_leads(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;