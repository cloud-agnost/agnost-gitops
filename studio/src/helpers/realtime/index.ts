import { RealtimeObjectTypes } from "@/types";
import Cluster from "./Cluster";
import Container from "./Container";
import OrgMember from "./OrgMember";
import Organization from "./Organization";
import Project from "./Project";
import ProjectEnvironment from "./ProjectEnvironment";
import ProjectTeam from "./ProjectTeam";
import Resource from "./Resources";
import User from "./User";
export function realtimeObjectMapper(type: RealtimeObjectTypes) {
  const keys = {
    user: User,
    org: Organization,
    "org.resource": Resource,
    cluster: Cluster,
    resource: Resource,
    "org.resource.log": Resource,
    "org.project": Project,
    "org.project.environment": ProjectEnvironment,
    "org.project.environment.container": Container,
    "org.project.team": ProjectTeam,
    "org.member": OrgMember,
  };
  return new keys[type]();
}
