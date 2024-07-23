import { CopyButton } from '@/components/CopyButton';
import { Description } from '@/components/Description';
import { isIPAddress } from '@/utils';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { useTranslation } from 'react-i18next';

interface DnsSettingsProps {
	ips: string[];
	description: string;
	slug: string;
	isWildcard?: boolean;
	isContainer?: boolean;
}

export default function DnsSettings({
	ips,
	description,
	slug,
	isWildcard,
	isContainer,
}: DnsSettingsProps) {
	const { t } = useTranslation();
	const isIp = isIPAddress(ips[0] ?? '');

	return (
		<div className='space-y-6 text-default'>
			<Description title={t('cluster.dns_settings')}>{description}</Description>
			<div className='text-default  space-y-4'>
				<div className='grid grid-cols-[3fr_2fr_7fr_1fr] gap-4'>
					<p>{isIp ? t('general.name') : 'Name/Hostname'}</p>
					<p>{t('general.type')}</p>
					<p>{isIp ? t('cluster.ip') : t('cluster.target')}</p>
					<p>{t('cluster.ttl')}</p>
				</div>
				<Separator />
				{ips.map((ip) => (
					<div className='grid grid-cols-[3fr_2fr_7fr_1fr] gap-4' key={ip}>
						<p className='mt-1'>{isWildcard ? '*' : '@'}</p>
						<p className='mt-1'>{isIp ? t('cluster.at') : t('cluster.cname')}</p>
						<div className='flex items-center gap-3 group'>
							<div className='truncate font-mono'>{ip}</div>
							<CopyButton text={ip} className='invisible group-hover:visible' />
						</div>
						<p className='mt-1'>1 {t('general.hour')}</p>
					</div>
				))}

				{(!isContainer || isWildcard) && (
					<div className='grid grid-cols-[3fr_2fr_7fr_1fr] gap-4'>
						<p className='mt-1'>_acme-challenge</p>
						<p className='mt-1'> {t('cluster.cname')}</p>
						<div className='flex items-center gap-3 group'>
							<div className='truncate font-mono'>acme-{slug}.agnost.dev</div>
							<CopyButton
								text={`acme-${slug}.agnost.dev`}
								className='invisible group-hover:visible'
							/>
						</div>
						<p className='mt-1'>1 {t('general.hour')}</p>
					</div>
				)}
			</div>
		</div>
	);
}
