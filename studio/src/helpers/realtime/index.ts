import { RealtimeObjectTypes } from "@/types";
import Cluster from "./Cluster";
import Container from "./Container";
import Environment from "./Environment";
import OrgMember from "./OrgMember";
import Organization from "./Organization";
import Project from "./Project";
import ProjectTeam from "./ProjectTeam";
import User from "./User";
export function realtimeObjectMapper(type: RealtimeObjectTypes) {
  const keys = {
    user: User,
    org: Organization,
    cluster: Cluster,
    "org.project": Project,
    "org.project.environment": Environment,
    "org.project.environment.container": Container,
    "org.project.team": ProjectTeam,
    "org.member": OrgMember,
  };
  return new keys[type]();
}
