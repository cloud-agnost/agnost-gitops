import useClusterStore from "@/store/cluster/clusterStore";
import { ClusterResourceStatus, RealtimeActionParams } from "@/types";
import { RealtimeActions } from "./RealtimeActions";

class Cluster implements RealtimeActions<ClusterResourceStatus[]> {
  update(param: RealtimeActionParams<ClusterResourceStatus[]>): void {
    console.log("Cluster update", param);
    useClusterStore.setState?.((prev) => ({
      ...prev,
      clusterComponentsReleaseInfo: prev.clusterComponentsReleaseInfo.map(
        (component) => ({
          ...component,
        })
      ),
    }));
  }
  telemetry(param: RealtimeActionParams<ClusterResourceStatus[]>): void {
    this.update(param);
  }
}

export default Cluster;
