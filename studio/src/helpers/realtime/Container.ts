import useContainerStore from "@/store/container/containerStore";
import { Container as ContainerType, RealtimeActionParams } from "@/types";
import { RealtimeActions } from "./RealtimeActions";
class Container implements RealtimeActions<ContainerType> {
  delete(param: RealtimeActionParams<ContainerType>): void {
    useContainerStore.setState?.((state) => ({
      ...state,
      containers: state.containers.filter(
        (container) => container._id !== param.identifiers.containerId
      ),
    }));
  }
  update(param: RealtimeActionParams<ContainerType>): void {
    useContainerStore.setState?.((state) => ({
      ...state,
      containers: state.containers.map((container) => {
        if (container._id === param.data._id) {
          return param.data;
        }
        return container;
      }),
    }));
  }
  create(param: RealtimeActionParams<ContainerType>): void {
    useContainerStore.setState?.((state) => ({
      ...state,
      containers: [
        ...state.containers.filter((en) => en._id !== param.data._id),
        param.data,
      ],
    }));
  }
  telemetry(param: RealtimeActionParams<ContainerType>): void {
    this.update(param);
  }
  log(): void {
    return;
  }
}

export default Container;
