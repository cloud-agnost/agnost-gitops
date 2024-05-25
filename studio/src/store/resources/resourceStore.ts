import { ResourceService } from '@/services';
import {
	APIError,
	AddExistingResourceRequest,
	CreateResourceRequest,
	DeleteResourceRequest,
	GetResourceRequest,
	GetResourcesRequest,
	Resource,
	ResourceCreateType,
	ResourceType,
	RestartManagedResourceRequest,
	UpdateManagedResourceConfigurationRequest,
	UpdateResourceAccessSettingsRequest,
	UpdateResourceAllowedRolesRequest,
} from '@/types';
import { joinChannel, leaveChannel } from '@/utils';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
export interface ResourceStore {
	resources: Resource[];
	resource: Resource | null;
	isCreateResourceModalOpen: boolean;
	resourceConfig: {
		instance: string;
		type: string;
		resourceType: ResourceType;
	};
	openCreateReplicaModal: boolean;
	isDeletedResourceModalOpen: boolean;
	deletedResource: Resource | null;
	isEditResourceModalOpen: boolean;
	resourceToEdit: Resource;
	isSelectResourceTypeModalOpen: boolean;
	selectedResourceCreateType: ResourceCreateType | undefined;
}

type Actions = {
	getResources: (req: GetResourcesRequest) => Promise<Resource[]>;
	getResource: (req: GetResourceRequest) => Promise<Resource>;
	testExistingResourceConnection: (req: AddExistingResourceRequest) => Promise<void>;
	addExistingResource: (req: AddExistingResourceRequest) => Promise<Resource>;
	toggleCreateResourceModal: () => void;
	selectResourceType: (instance: string, type: string, resourceType: ResourceType) => void;
	openDeleteResourceModal: (resource: Resource) => void;
	closeDeleteResourceModal: () => void;
	deleteResource: (req: DeleteResourceRequest) => Promise<void>;
	createNewResource: (req: CreateResourceRequest) => Promise<Resource>;
	updateResourceAllowedRoles: (req: UpdateResourceAllowedRolesRequest) => Promise<Resource>;
	updateResourceAccessSettings: (req: UpdateResourceAccessSettingsRequest) => Promise<Resource>;
	updateManagedResourceConfiguration: (
		req: UpdateManagedResourceConfigurationRequest,
	) => Promise<Resource>;
	openEditResourceModal: (resource: Resource, type: string) => void;
	closeEditResourceModal: () => void;
	getOrgResources: (req: GetResourcesRequest) => Promise<Resource[]>;
	openSelectResourceTypeModal: (type: ResourceCreateType) => void;
	closeSelectResourceTypeModal: () => void;
	restartManagedResource: (req: RestartManagedResourceRequest) => Promise<Resource>;
	enableTcpProxy: (req: RestartManagedResourceRequest) => Promise<Resource>;
	disableTcpProxy: (req: RestartManagedResourceRequest) => Promise<Resource>;
	reset: () => void;
};
const initialState: ResourceStore = {
	resources: [],
	resource: null,
	isCreateResourceModalOpen: false,
	resourceConfig: {
		type: '',
		instance: '',
		resourceType: '' as ResourceType,
	},
	openCreateReplicaModal: false,
	isDeletedResourceModalOpen: false,
	deletedResource: null,
	isEditResourceModalOpen: false,
	resourceToEdit: {} as Resource,
	isSelectResourceTypeModalOpen: false,
	selectedResourceCreateType: undefined,
};

const useResourceStore = create<ResourceStore & Actions>()(
	devtools((set) => ({
		...initialState,
		getResources: async (req: GetResourcesRequest) => {
			try {
				const resources = await ResourceService.getResources(req);
				set({
					resources,
				});
				resources.forEach((resource) => {
					joinChannel(resource._id);
				});
				return resources;
			} catch (error) {
				throw error as APIError;
			}
		},

		getResource: async (req: GetResourceRequest) => {
			try {
				const resource = await ResourceService.getResource(req);
				set({
					resource,
				});
				joinChannel(resource._id);
				return resource;
			} catch (error) {
				throw error as APIError;
			}
		},
		testExistingResourceConnection: async (req: AddExistingResourceRequest) => {
			try {
				await ResourceService.testExistingResourceConnection(req);
				if (req.onSuccess) req.onSuccess();
			} catch (error) {
				if (req.onError) req.onError(error as APIError);
				throw error as APIError;
			}
		},
		addExistingResource: async (req: AddExistingResourceRequest) => {
			try {
				const resource = await ResourceService.addExistingResource(req);
				set((state) => ({
					resources: [resource, ...state.resources],
					resourceType: {
						type: '',
						instance: '',
						resourceType: '',
					},
				}));
				if (req.onSuccess) req.onSuccess();
				joinChannel(resource._id);
				return resource;
			} catch (error) {
				if (req.onError) req.onError(error as APIError);
				throw error as APIError;
			}
		},
		toggleCreateResourceModal: () =>
			set((state) => ({
				isCreateResourceModalOpen: !state.isCreateResourceModalOpen,
				resourceType: {
					type: '',
					instance: '',
				},
			})),
		selectResourceType: (instance: string, type: string, resourceType: ResourceType) =>
			set({
				resourceConfig: {
					type,
					instance,
					resourceType,
				},
			}),
		openDeleteResourceModal: (resource: Resource) => {
			set({
				isDeletedResourceModalOpen: true,
				deletedResource: resource,
			});
		},
		closeDeleteResourceModal: () => {
			set({
				isDeletedResourceModalOpen: false,
				deletedResource: null,
			});
		},
		deleteResource: async (req: DeleteResourceRequest) => {
			try {
				await ResourceService.deleteResource(req);
				set((state) => ({
					resources: state.resources.filter((resource) => resource._id !== req.resourceId),
					isDeletedResourceModalOpen: false,
					deletedResource: null,
				}));
				leaveChannel(req.resourceId);
			} catch (error) {
				throw error as APIError;
			}
		},
		createNewResource: async (req: CreateResourceRequest) => {
			try {
				const resource = await ResourceService.createNewResource(req);
				set((state) => ({
					resources: [resource, ...state.resources],
					resourceType: {
						type: '',
						instance: '',
						resourceType: '',
					},
				}));
				joinChannel(resource._id);
				if (req.onSuccess) req.onSuccess();
				return resource;
			} catch (error) {
				if (req.onError) req.onError(error as APIError);
				throw error as APIError;
			}
		},
		updateResourceAllowedRoles: async (req: UpdateResourceAllowedRolesRequest) => {
			try {
				const resource = await ResourceService.updateResourceAllowedRoles(req);
				set((state) => ({
					resources: state.resources.map((r) => (r._id === resource._id ? resource : r)),
					resourceToEdit: resource,
				}));
				if (req.onSuccess) req.onSuccess();
				return resource;
			} catch (error) {
				if (req.onError) req.onError(error as APIError);
				throw error as APIError;
			}
		},
		updateResourceAccessSettings: async (req: UpdateResourceAccessSettingsRequest) => {
			try {
				const resource = await ResourceService.updateResourceAccessSettings(req);
				set((state) => ({
					resources: state.resources.map((r) => (r._id === resource._id ? resource : r)),
					resourceToEdit: resource,
				}));
				if (req.onSuccess) req.onSuccess();
				return resource;
			} catch (error) {
				if (req.onError) req.onError(error as APIError);
				throw error as APIError;
			}
		},
		updateManagedResourceConfiguration: async (req: UpdateManagedResourceConfigurationRequest) => {
			try {
				const resource = await ResourceService.updateManagedResourceConfiguration(req);
				set((state) => ({
					resources: state.resources.map((r) => (r._id === resource._id ? resource : r)),
					resourceToEdit: resource,
				}));
				if (req.onSuccess) req.onSuccess();
				return resource;
			} catch (error) {
				if (req.onError) req.onError(error as APIError);
				throw error as APIError;
			}
		},
		openEditResourceModal: (resource: Resource, type: string) => {
			set({
				isEditResourceModalOpen: true,
				resourceToEdit: resource,
				resourceConfig: {
					type: type,
					instance: resource.instance,
					resourceType: resource.type,
				},
			});
		},
		closeEditResourceModal: () => {
			set({
				isEditResourceModalOpen: false,
				resourceToEdit: {} as Resource,
			});
		},
		getOrgResources: async (req: GetResourcesRequest) => {
			try {
				const resources = await ResourceService.getOrganizationResources(req);
				set({
					resources,
				});
				return resources;
			} catch (error) {
				throw error as APIError;
			}
		},
		openSelectResourceTypeModal: (type) =>
			set({
				isSelectResourceTypeModalOpen: true,
				selectedResourceCreateType: type,
			}),
		closeSelectResourceTypeModal: () =>
			set({
				selectedResourceCreateType: undefined,
				isSelectResourceTypeModalOpen: false,
			}),
		restartManagedResource: async (req: RestartManagedResourceRequest) => {
			const resource = await ResourceService.restartManagedResource(req);
			set((state) => ({
				resources: state.resources.map((r) => (r._id === resource._id ? resource : r)),
				resourceToEdit: resource,
			}));
			return resource;
		},
		enableTcpProxy: async (req: RestartManagedResourceRequest) => {
			const resource = await ResourceService.enableTcpProxy(req);
			set((state) => ({
				resources: state.resources.map((r) => (r._id === resource._id ? resource : r)),
				resourceToEdit: resource,
			}));
			return resource;
		},
		disableTcpProxy: async (req: RestartManagedResourceRequest) => {
			const resource = await ResourceService.disableTcpProxy(req);
			set((state) => ({
				resources: state.resources.map((r) => (r._id === resource._id ? resource : r)),
				resourceToEdit: resource,
			}));
			return resource;
		},
		reset: () => {
			set(initialState);
		},
	})),
);

export default useResourceStore;
