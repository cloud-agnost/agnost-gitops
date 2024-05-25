import { RealtimeObjectTypes } from "@/types";
import ApplicationTeam from "./AppTeam";
import Application from "./Application";
import Bucket from "./Bucket";
import Cache from "./Cache";
import Cluster from "./Cluster";
import Container from "./Container";
import Database from "./Database";
import Endpoint from "./Endpoint";
import Environment from "./Environment";
import Field from "./Field";
import Function from "./Function";
import Middleware from "./Middleware";
import Model from "./Model";
import OrgMember from "./OrgMember";
import Organization from "./Organization";
import Project from "./Project";
import ProjectEnvironment from "./ProjectEnvironment";
import ProjectTeam from "./ProjectTeam";
import Queue from "./Queue";
import Resource from "./Resources";
import Storage from "./Storage";
import Task from "./Task";
import Typings from "./Typings";
import User from "./User";
import Version from "./Version";
import VersionProperties from "./VersionProperties";
export function realtimeObjectMapper(type: RealtimeObjectTypes) {
  const keys = {
    user: User,
    org: Organization,
    "org.app": Application,
    "org.app.team": ApplicationTeam,
    "org.resource": Resource,
    app: Application,
    cluster: Cluster,
    resource: Resource,
    queue: Queue,
    "org.app.version.queue": Queue,
    task: Task,
    "org.app.version.task": Task,
    endpoint: Endpoint,
    "org.app.version.endpoint": Endpoint,
    "org.app.version.environment": Environment,
    "org.app.version.keys": VersionProperties,
    "org.app.version.limits": VersionProperties,
    "org.app.version": Version,
    "org.app.version.packages": VersionProperties,
    version: Version,
    "org.app.version.db": Database,
    "org.app.version.db.model": Model,
    "org.app.version.db.model.field": Field,
    "org.app.version.storage": Storage,
    "org.app.version.storage.bucket": Bucket,
    "org.app.version.cache": Cache,
    "org.app.version.function": Function,
    "org.resource.log": Resource,
    "org.app.version.typings": Typings,
    "org.app.version.middleware": Middleware,
    "org.project": Project,
    "org.project.environment": ProjectEnvironment,
    "org.project.environment.container": Container,
    "org.project.team": ProjectTeam,
    "org.member": OrgMember,
  };
  return new keys[type]();
}
