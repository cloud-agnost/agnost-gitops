import { Button } from '@/components/Button';
import { NotFound } from '@/components/Error';
import useTabStore from '@/store/version/tabStore';
import { X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
export default function VersionNotFound() {
	const { t } = useTranslation();
	const { closeCurrentTab } = useTabStore();
	return (
		<NotFound>
			<Button className='mt-8' variant='primary' onClick={closeCurrentTab}>
				<X className='mr-1' />
				{t('version.close_tab')}
			</Button>
		</NotFound>
	);
}
