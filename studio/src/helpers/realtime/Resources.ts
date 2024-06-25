import useResourceStore from "@/store/resources/resourceStore";
import { RealtimeActionParams, Resource as ResourceType } from "@/types";
import { RealtimeActions } from "./RealtimeActions";

class Resource implements RealtimeActions<ResourceType> {
  delete({ identifiers }: RealtimeActionParams<ResourceType>) {
    useResourceStore.setState?.({
      resources: useResourceStore
        .getState?.()
        .resources.filter(
          (resource) => resource._id !== identifiers.resourceId
        ),
    });
  }
  update({ data }: RealtimeActionParams<ResourceType>) {
    useResourceStore.setState?.({
      resources: useResourceStore.getState?.().resources.map((resource) => {
        if (resource._id === data._id) {
          return data;
        }
        return resource;
      }),
    });
  }
  create({ data }: RealtimeActionParams<ResourceType>) {
    useResourceStore.setState?.({
      resources: [...useResourceStore.getState().resources, data],
    });
  }
  telemetry(params: RealtimeActionParams<ResourceType>) {
    this.update(params);
  }
}

export default Resource;
