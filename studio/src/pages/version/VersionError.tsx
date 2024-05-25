import { Button } from '@/components/Button';
import { Error } from '@/components/Error';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { X } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function VersionError() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { closeCurrentTab, updateCurrentTab } = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { versionId } = useParams() as Record<string, string>;
	const { pathname } = useLocation();
	useEffect(() => {
		if (!pathname.includes('error')) {
			const path = getVersionDashboardPath('error');
			updateCurrentTab(versionId, {
				path,
			});
			navigate(path);
		}
	}, []);
	return (
		<Error>
			<Button className='mt-8' variant='primary' onClick={closeCurrentTab}>
				<X className='mr-1' />
				{t('version.close_tab')}
			</Button>
		</Error>
	);
}
