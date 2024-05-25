import ApplicationService from '@/services/ApplicationService';
import {
	APIError,
	AppInviteRequest,
	AppPermissions,
	AppRoles,
	Application,
	ApplicationMember,
	ChangeAppNameRequest,
	CreateApplicationRequest,
	DeleteApplicationRequest,
	GetInvitationRequest,
	Invitation,
	InvitationRequest,
	RemoveAppAvatarRequest,
	RemoveMemberRequest,
	SetAppAvatarRequest,
	TransferRequest,
	UpdateAppMemberRoleRequest,
	UpdateAppParams,
	UpdateRoleRequest,
} from '@/types';

import { VersionService } from '@/services';
import useAuthStore from '@/store/auth/authStore';
import { joinChannel, leaveChannel } from '@/utils';
import OrganizationService from 'services/OrganizationService.ts';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import useOrganizationStore from '../organization/organizationStore';
import useVersionStore from '../version/versionStore';

interface ApplicationState {
	application: Application | null;
	applications: Application[];
	toDeleteApp: Application | null;
	applicationTeam: ApplicationMember[];
	tempTeam: ApplicationMember[];
	isVersionOpen: boolean;
	isEditAppOpen: boolean;
	isInviteMemberOpen: boolean;
	invitations: Invitation[];
	appAuthorization: AppPermissions;
	isDeleteModalOpen: boolean;
	isLeaveModalOpen: boolean;
	lastFetchedInvitationsPage: number;
	loading: boolean;
}

type Actions = {
	getAppById: (orgId: string, appId: string) => Promise<Application>;
	selectApplication: (application: Application) => void;
	changeAppName: (req: ChangeAppNameRequest) => Promise<Application>;
	setAppAvatar: (req: SetAppAvatarRequest) => Promise<Application>;
	removeAppAvatar: (req: RemoveAppAvatarRequest) => Promise<Application>;
	transferAppOwnership: (req: TransferRequest) => Promise<Application>;
	getAppTeamMembers: (req: UpdateAppParams) => Promise<ApplicationMember[]>;
	filterApplicationTeam: (search: string) => ApplicationMember[];
	changeAppTeamRole: (req: UpdateAppMemberRoleRequest) => Promise<ApplicationMember>;
	removeAppMember: (req: RemoveMemberRequest) => Promise<void>;
	removeMultipleAppMembers: (req: RemoveMemberRequest) => Promise<void>;
	inviteUsersToApp: (req: AppInviteRequest) => Promise<Invitation[]>;
	getAppInvitations: (req: GetInvitationRequest) => Promise<Invitation[]>;
	openVersionDrawer: (application: Application) => void;
	closeVersionDrawer: (clearApp?: boolean) => void;
	openEditAppDrawer: (application: Application) => void;
	closeEditAppDrawer: (clearApp?: boolean) => void;
	openInviteMemberDrawer: (application: Application) => void;
	closeInviteMemberDrawer: () => void;
	resendInvitation: (req: InvitationRequest) => Promise<void>;
	updateInvitationUserRole: (req: UpdateRoleRequest) => Promise<Invitation>;
	deleteInvitation: (req: InvitationRequest) => Promise<void>;
	deleteMultipleInvitations: (req: InvitationRequest) => Promise<void>;
	getAppsByOrgId: (orgId: string) => Promise<Application[] | APIError>;
	createApplication: (req: CreateApplicationRequest) => Promise<Application | APIError>;
	leaveAppTeam: (req: DeleteApplicationRequest) => Promise<void>;
	deleteApplication: (req: DeleteApplicationRequest) => Promise<void>;
	getAppPermissions: (orgId: string) => Promise<AppPermissions>;
	openDeleteModal: (application: Application) => void;
	closeDeleteModal: () => void;
	openLeaveModal: (application: Application) => void;
	closeLeaveModal: () => void;
	onAppClick: (app: Application) => void;
	reset: () => void;
};

// define the initial state
const initialState: ApplicationState = {
	application: null,
	applications: [],
	applicationTeam: [],
	tempTeam: [],
	isVersionOpen: false,
	isEditAppOpen: false,
	isInviteMemberOpen: false,
	invitations: [],
	appAuthorization: {} as AppPermissions,
	isDeleteModalOpen: false,
	isLeaveModalOpen: false,
	toDeleteApp: null,
	lastFetchedInvitationsPage: 0,
	loading: false,
};

const useApplicationStore = create<ApplicationState & Actions>()(
	subscribeWithSelector(
		devtools((set, get) => ({
			...initialState,
			getAppById: async (orgId: string, appId: string) => {
				try {
					const application = await ApplicationService.getAppById(orgId, appId);
					get().selectApplication(application);
					return application;
				} catch (error) {
					throw error as APIError;
				}
			},
			openDeleteModal: (application: Application) => {
				set({
					isDeleteModalOpen: true,
					toDeleteApp: application,
				});
			},
			closeDeleteModal: () => {
				set({
					isDeleteModalOpen: false,
					toDeleteApp: null,
				});
			},
			openLeaveModal: (application: Application) => {
				set({
					isLeaveModalOpen: true,
					toDeleteApp: application,
				});
			},
			closeLeaveModal: () => {
				set({
					isLeaveModalOpen: false,
					toDeleteApp: null,
				});
			},
			selectApplication: (application: Application) => {
				const user = useAuthStore.getState()?.user;
				const role = user.isClusterOwner
					? AppRoles.Admin
					: (application?.team.find((t) => t.userId._id === user?._id)?.role as AppRoles);

				set({
					application: {
						...application,
						role,
					},
				});
				joinChannel(application._id);
			},
			changeAppName: async (req: ChangeAppNameRequest) => {
				try {
					const application = await ApplicationService.changeAppName(req);
					get().selectApplication(application);
					if (req.onSuccess) req.onSuccess();
					return application;
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			setAppAvatar: async (req: SetAppAvatarRequest) => {
				try {
					const application = await ApplicationService.setAppAvatar(req);
					get().selectApplication(application);
					if (req.onSuccess) req.onSuccess();

					return application;
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			removeAppAvatar: async (req: RemoveAppAvatarRequest) => {
				try {
					const application = await ApplicationService.removeAppAvatar(req);
					get().selectApplication(application);
					if (req.onSuccess) req.onSuccess();
					return application;
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			transferAppOwnership: async (req: TransferRequest) => {
				try {
					const application = await ApplicationService.transferAppOwnership(req);
					get().selectApplication(application);
					return application;
				} catch (error) {
					throw error as APIError;
				}
			},
			getAppTeamMembers: async (req: UpdateAppParams) => {
				try {
					const applicationTeam = await ApplicationService.getAppMembers(req);
					set({
						applicationTeam,
						tempTeam: applicationTeam,
					});
					return applicationTeam;
				} catch (error) {
					throw error as APIError;
				}
			},
			filterApplicationTeam: (search: string) => {
				const { tempTeam, applicationTeam } = get();
				if (search === '') {
					set({ applicationTeam: tempTeam });
					return tempTeam;
				} else {
					const filteredTeam = applicationTeam?.filter(({ member }) =>
						member.name.toLowerCase().includes(search.toLowerCase()),
					);
					set({ applicationTeam: filteredTeam });
					return filteredTeam;
				}
			},
			changeAppTeamRole: async (req: UpdateAppMemberRoleRequest) => {
				const { userId, role, onSuccess, onError } = req;
				try {
					const member = await ApplicationService.changeMemberRole(req);
					set({
						applicationTeam: get().applicationTeam.map((team) => {
							if (team.member._id === userId) {
								team.role = role;
							}
							return team;
						}),
					});
					if (onSuccess) onSuccess();
					return member;
				} catch (error) {
					if (onError) onError(error as APIError);
					throw error as APIError;
				}
			},
			removeAppMember: async (req: RemoveMemberRequest) => {
				try {
					await ApplicationService.removeAppMember(req);
					set({
						applicationTeam: get().applicationTeam.filter((team) => team.member._id !== req.userId),
					});
					if (req.onSuccess) req.onSuccess();
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			removeMultipleAppMembers: async (req: RemoveMemberRequest) => {
				try {
					await ApplicationService.removeMultipleAppMembers(req);
					set({
						applicationTeam: get().applicationTeam.filter(
							(team) => !req.userIds?.includes(team.member._id),
						),
					});
				} catch (error) {
					throw error as APIError;
				}
			},
			inviteUsersToApp: async (req: AppInviteRequest) => {
				try {
					const invitations = await ApplicationService.inviteUsersToApp(req);
					if (req.onSuccess) req.onSuccess();
					return invitations;
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			getAppInvitations: async (req: GetInvitationRequest) => {
				try {
					const invitations = await ApplicationService.getAppInvitations(req);
					if (req.page === 0) set({ invitations });
					else
						set({
							invitations: [...invitations, ...get().invitations],
							lastFetchedInvitationsPage: req.page,
						});
					return invitations;
				} catch (error) {
					throw error as APIError;
				}
			},
			openVersionDrawer: async () => {
				set({
					isVersionOpen: true,
				});
			},
			closeVersionDrawer: (clearApp?: boolean) => {
				set({
					isVersionOpen: false,
					...(clearApp && { application: null }),
				});
			},
			openEditAppDrawer: (application: Application) => {
				set({
					isEditAppOpen: true,
				});
				get().selectApplication(application);
			},
			closeEditAppDrawer: (clearApp?: boolean) => {
				set({
					isEditAppOpen: false,
					isVersionOpen: false,
					...(clearApp && { application: null }),
				});
				const searchParams = new URLSearchParams(window.location.search);
				searchParams.delete('t');
				searchParams.delete('r');
				searchParams.delete('e');
				searchParams.delete('s');
				searchParams.delete('d');
				window.history.replaceState({}, '', `${window.location.pathname}`);
			},
			openInviteMemberDrawer: (application: Application) => {
				get().selectApplication(application);
				set({
					isInviteMemberOpen: true,
				});
			},
			closeInviteMemberDrawer: () => {
				set({
					isInviteMemberOpen: false,
				});
			},
			resendInvitation: async (req: InvitationRequest) => {
				try {
					await ApplicationService.resendInvitation(req);
					if (req.onSuccess) req.onSuccess();
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			deleteInvitation: async (req: InvitationRequest) => {
				try {
					await ApplicationService.deleteInvitation(req);
					set({
						invitations: get().invitations.filter((invitation) => invitation.token !== req.token),
					});
					if (req.onSuccess) req.onSuccess();
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			deleteMultipleInvitations: async (req: InvitationRequest) => {
				try {
					await ApplicationService.deleteMultipleInvitations(req);
					set({
						invitations: get().invitations.filter(
							(invitation) => !req.tokens?.includes(invitation.token),
						),
					});
					if (req.onSuccess) req.onSuccess();
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			updateInvitationUserRole: async (req: UpdateRoleRequest) => {
				try {
					const invitation = await ApplicationService.updateInvitationUserRole(req);
					set({
						invitations: get().invitations.map((invitation) => {
							if (invitation.token === req.token) {
								invitation.role = req.role;
							}
							return invitation;
						}),
					});
					if (req.onSuccess) req.onSuccess();
					return invitation;
				} catch (error) {
					if (req.onError) req.onError(error as APIError);
					throw error as APIError;
				}
			},
			getAppsByOrgId: async (orgId: string) => {
				try {
					const applications = await OrganizationService.getOrganizationApps(orgId);
					set({ applications });
					applications.forEach((app) => {
						joinChannel(app._id);
					});
					return applications;
				} catch (error) {
					throw error as APIError;
				}
			},
			createApplication: async ({ orgId, name, onSuccess, onError }: CreateApplicationRequest) => {
				try {
					const { app } = await OrganizationService.createApplication({ orgId, name });
					if (onSuccess) onSuccess();
					const role = app.team.find(
						(team) => team.userId._id === useAuthStore.getState().user?._id,
					)?.role;
					set((prev) => ({
						applications: [
							...prev.applications,
							{
								...app,
								team: [
									{
										userId: useAuthStore.getState().user as any,
										role: role as string,
										_id: '',
										joinDate: '',
									},
								],
							},
						],
					}));
					joinChannel(app._id);
					return app;
				} catch (error) {
					if (onError) onError(error as APIError);
					throw error as APIError;
				}
			},
			leaveAppTeam: async ({ appId, orgId, onSuccess, onError }: DeleteApplicationRequest) => {
				try {
					await OrganizationService.leaveAppTeam(appId, orgId);
					set((prev) => ({
						applications: prev.applications.filter((app) => app._id !== appId),
					}));
					leaveChannel(appId);
					if (onSuccess) onSuccess();
				} catch (error) {
					if (onError) onError(error as APIError);
					throw error as APIError;
				}
			},
			deleteApplication: async ({ appId, orgId, onSuccess, onError }: DeleteApplicationRequest) => {
				try {
					await OrganizationService.deleteApplication(appId, orgId);
					set((prev) => ({
						applications: prev.applications.filter((app) => app._id !== appId),
					}));
					leaveChannel(appId);
					if (onSuccess) onSuccess();
				} catch (error) {
					if (onError) onError(error as APIError);
					throw error as APIError;
				}
			},
			getAppPermissions: async (orgId: string) => {
				try {
					const appAuthorization = await ApplicationService.getAllAppRoleDefinitions(orgId);
					set({ appAuthorization });
					return appAuthorization;
				} catch (error) {
					throw error as APIError;
				}
			},
			onAppClick: async (app: Application) => {
				const { selectApplication, openVersionDrawer } = get();
				selectApplication(app);
				set({ loading: true });
				const { selectVersion } = useVersionStore.getState();
				const orgId = useOrganizationStore.getState().organization?._id as string;
				const versions = await VersionService.getAllVersionsVisibleToUser({
					orgId,
					appId: app?._id as string,
					page: 0,
					size: 2,
				});

				if (versions.length === 1) {
					selectVersion(versions[0]);
				} else {
					openVersionDrawer(app);
				}
				set({ loading: false });
			},
			reset: () => set(initialState),
		})),
	),
);

export default useApplicationStore;
