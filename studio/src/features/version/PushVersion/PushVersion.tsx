import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { useTable, useToast } from '@/hooks';
import useVersionStore from '@/store/version/versionStore';
import { APIError } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PushVersionTableColumns } from './PushVersionTableColumns';
import { useParams } from 'react-router-dom';
import { Switch } from '@/components/Switch';
import { Label } from '@/components/Label';
export default function PushVersion() {
	const { t } = useTranslation();
	const [redeploy, setRedeploy] = useState(true);
	const { appId, orgId } = useParams();
	const { isPushVersionDrawerOpen, togglePushVersionDrawer, versions, version, pushVersion } =
		useVersionStore();
	const { toast } = useToast();
	const [step, setStep] = useState(0);
	const versionsExcludedCurrent = useMemo(
		() => versions.filter((v) => v._id !== version._id),
		[versions, version],
	);

	const table = useTable({
		data: versionsExcludedCurrent,
		columns: PushVersionTableColumns,
		enableMultiRowSelection: false,
	});

	const { isPending, mutate } = useMutation({
		mutationFn: () =>
			pushVersion({
				orgId: orgId as string,
				appId: appId as string,
				targetVersionId: table.getSelectedRowModel().rows[0].original._id,
				versionId: version._id,
				redeploy,
			}),
		mutationKey: ['pushVersion', version._id],
		onSuccess: () => {
			toast({
				title: t('version.pushed_successfully') as string,
				action: 'success',
			});
			onClosed();
		},
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	function onClosed() {
		setStep(0);
		togglePushVersionDrawer();
		table.resetRowSelection();
	}

	return (
		<Drawer open={isPushVersionDrawerOpen} onOpenChange={onClosed}>
			<DrawerContent position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('version.push_to_version')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6'>
					{step === 0 && (
						<div className='space-y-6'>
							<DataTable table={table} />
							<div className='flex justify-end'>
								<Button
									onClick={() => setStep(1)}
									disabled={table.getSelectedRowModel().rows.length === 0}
									className='!ml-4'
								>
									{t('general.next')}
								</Button>
							</div>
						</div>
					)}
					{step === 1 && (
						<div className='space-y-6'>
							<Alert variant='warning'>
								<AlertTitle>{t('general.warning')}</AlertTitle>
								<AlertDescription>
									You are about to push from source version <strong>{version.name}</strong> into
									target version{' '}
									<strong>{table.getSelectedRowModel().rows[0].original.name}</strong>
									.
									<br />
									<br />
									Please note that the following design entities{' '}
									<strong>Environment Variables</strong>, <strong>API Keys</strong>,{' '}
									<strong>Authentication Settings</strong>, <strong>Environment Settings</strong>{' '}
									will not be pushed to the target version and you need to manually update these
									items.
									{/* Automatically redeploy the changes to the target version (on-off switch, default
									on) */}
								</AlertDescription>
							</Alert>
							<div className='flex items-center justify-between space-x-2'>
								<Label htmlFor='redeploy'>
									Redeploy target version after successful push operation
								</Label>
								<Switch id='redeploy' checked={redeploy} onCheckedChange={setRedeploy} />
							</div>
							<div className='flex items-center justify-between'>
								<DrawerClose>
									<Button variant='secondary' className='!ml-4'>
										{t('general.cancel')}
									</Button>
								</DrawerClose>
								<div className='flex items-center'>
									<Button variant='outline' onClick={() => setStep(0)} className='!ml-4'>
										{t('general.previous')}
									</Button>
									<Button onClick={() => mutate()} loading={isPending} className='!ml-4'>
										{t('general.confirm')}
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
