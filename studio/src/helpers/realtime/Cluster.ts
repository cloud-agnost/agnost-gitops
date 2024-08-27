import useClusterStore from "@/store/cluster/clusterStore";
import { Cluster as ClusterType, RealtimeActionParams } from "@/types";
import { RealtimeActions } from "./RealtimeActions";

class Cluster implements RealtimeActions<ClusterType> {
  update(param: RealtimeActionParams<ClusterType>): void {
    useClusterStore.setState?.({ cluster: param.data });
  }
  telemetry(param: RealtimeActionParams<ClusterType>): void {
    this.update(param);
  }
}

export default Cluster;
