import { Button } from '@/components/Button';
import { DeployButton } from '@/features/version/DeployButton';
import useEnvironmentStore from '@/store/environment/environmentStore.ts';
import { ArrowLeft } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AutoRedeploy } from '../AutoRedeploy';
import { SuspendButton } from '../SuspendButton';

interface DeploymentSettingsProps {
	isOpen: boolean;
	close: () => void;
}

export default function DeploymentSettings({ isOpen, close }: DeploymentSettingsProps) {
	const { t } = useTranslation();
	const environment = useEnvironmentStore((state) => state.environment);

	const settings = [
		{
			title: t('version.auto_redeploy'),
			description: t('version.auto_redeploy_desc'),
			element: <AutoRedeploy />,
		},
		{
			title: t('version.redeploy'),
			description: t('version.redeploy_desc'),
			element: <DeployButton />,
		},
		{
			title: environment?.suspended
				? t('version.reactivate_services')
				: t('version.suspend_services'),
			description: environment?.suspended
				? t('version.reactivate_services_desc')
				: t('version.suspend_services_desc'),
			element: <SuspendButton />,
		},
	];

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{
						x: '100%',
					}}
					animate={{
						x: 0,
					}}
					transition={{ type: 'tween' }}
					exit={{
						x: '100%',
					}}
					className='deployment-settings'
				>
					<header className='deployment-settings-header'>
						<Button onClick={close} rounded variant='icon' size='sm'>
							<ArrowLeft size={20} />
						</Button>
						<h4>{t('version.deployment_settings')}</h4>
					</header>
					<div className='deployment-settings-items'>
						{settings.map(({ title, description, element }, index) => (
							<div className='deployment-settings-item' key={index}>
								<div className='deployment-settings-text'>
									<h5>{title}</h5>
									<p>{description}</p>
								</div>
								<div className='flex items-center'>{element}</div>
							</div>
						))}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
