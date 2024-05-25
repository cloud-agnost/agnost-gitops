import { CopyButton } from '@/components/CopyButton';
import { Description } from '@/components/Description';
import useClusterStore from '@/store/cluster/clusterStore';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';

export default function DnsSettings() {
	const { t } = useTranslation();
	const { cluster } = useClusterStore();
	return (
		<div className='space-y-6 text-default'>
			<Description title={t('cluster.dns_settings')}>
				{t('cluster.dns_settings_description')}
			</Description>
			<div className='text-default font-sfCompact space-y-4'>
				<div className='flex justify-between'>
					<p className='flex-1'>{t('general.name')}</p>
					<p className='flex-1'>{t('general.type')}</p>
					<p className='flex-1'>{t('general.value')}</p>
					<p className='flex-1'>{t('cluster.ttl')}</p>
				</div>
				<Separator />
				{cluster?.ips.map((ip) => (
					<div className='grid grid-cols-4' key={ip}>
						<p className='mt-1'>A</p>
						<p className='mt-1'>@</p>
						<div className='flex items-center gap-3 group'>
							<div className='truncate font-mono'>{ip}</div>
							<CopyButton text={ip} className='invisible group-hover:visible' />
						</div>
						<p className='mt-1'>1 {t('general.hour')}</p>
					</div>
				))}
			</div>
		</div>
	);
}
