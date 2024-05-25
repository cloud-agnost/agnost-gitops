import { Button } from '@/components/Button';
import { Plus } from '@phosphor-icons/react';
import './organization.scss';
import { useTranslation } from 'react-i18next';
function OrganizationCreateButton({ ...props }) {
	const { t } = useTranslation();
	return (
		<div className='create-button-container'>
			<Button size='sm' variant='secondary' className='create-button' {...props}>
				<Plus size={64} weight='bold' className='create-button-icon' />
			</Button>
			<span className='create-button-label'>{t('organization.create')}</span>
		</div>
	);
}

export { OrganizationCreateButton };
