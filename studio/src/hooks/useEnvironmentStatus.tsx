import useEnvironmentStore from '@/store/environment/environmentStore';
import { EnvironmentStatus } from '@/types';
import { useMemo } from 'react';
export default function useEnvironmentStatus() {
	const { environment, resources } = useEnvironmentStore();
	return useMemo(() => {
		if (environment && resources) {
			const hasStatus = (statuses: string[]) =>
				Object.values(environment).some((status) => statuses.includes(status));

			const hasSpecificResourcesStatus = (statusToCheck: EnvironmentStatus) =>
				resources.some(({ status }) => status === statusToCheck);

			const checksAndValues = [
				{ check: environment.suspended, value: EnvironmentStatus.Suspended },
				{
					check: hasStatus(['Error']) || hasSpecificResourcesStatus(EnvironmentStatus.Error),
					value: EnvironmentStatus.Error,
				},
				{
					check: hasStatus([EnvironmentStatus.Deploying, EnvironmentStatus.Redeploying]),
					value: EnvironmentStatus.Deploying,
				},
				{
					check:
						hasStatus([EnvironmentStatus.Updating]) ||
						hasSpecificResourcesStatus(EnvironmentStatus.Updating),
					value: EnvironmentStatus.Updating,
				},
				{
					check: hasSpecificResourcesStatus(EnvironmentStatus.Idle),
					value: EnvironmentStatus.Idle,
				},
			];

			const result = checksAndValues.find(({ check }) => check);

			return result?.value ?? EnvironmentStatus.OK;
		}
	}, [environment, resources]);
}
