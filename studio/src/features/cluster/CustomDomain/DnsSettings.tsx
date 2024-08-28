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
	isRootDomain: boolean;
}

export default function DnsSettings({
	ips,
	description,
	slug,
	isWildcard,
	isContainer,
	isRootDomain,
}: DnsSettingsProps) {
	const { t } = useTranslation();
	const isIp = isIPAddress(ips[0] ?? '');

	return (
		<div className='space-y-6 text-default'>
			<Description title={t('cluster.dns_settings')}>{description}</Description>
			<div className='text-xs space-y-4'>
				<div className='grid grid-cols-[3fr_1fr_6fr_1fr] gap-4 font-bold'>
					<p>{isIp ? t('general.name') : 'Name/Hostname'}</p>
					<p>{t('general.type')}</p>
					<p>{isIp ? t('cluster.ip') : t('cluster.target')}</p>
					<p>{t('cluster.ttl')}</p>
				</div>
				<Separator />
				{ips?.map((ip) => (
					<>
						{(!isContainer || (isContainer && !isWildcard)) && (
							<div className='grid grid-cols-[3fr_1fr_6fr_1fr] gap-4' key={ip}>
								<p className='mt-1'>{'@'}</p>
								<p className='mt-1'>
									{isIp
										? t('cluster.at')
										: !isWildcard && isRootDomain
										? t('cluster.alias')
										: t('cluster.cname')}
								</p>
								<div className='flex items-center gap-3 group font-mono'>
									<div className='truncate font-mono'>{ip}</div>
									<CopyButton text={ip} className='invisible group-hover:visible' />
								</div>
								<p className='mt-1'>1 {t('general.hour')}</p>
							</div>
						)}
						{(!isContainer || (isContainer && isWildcard)) && (
							<div className='grid grid-cols-[3fr_1fr_6fr_1fr] gap-4' key={ip}>
								<p className='mt-1 font-mono'>{'*'}</p>
								<p className='mt-1'>{isIp ? t('cluster.at') : t('cluster.cname')}</p>
								<div className='flex items-center gap-3 group font-mono'>
									<div className='truncate font-mono'>{ip}</div>
									<CopyButton text={ip} className='invisible group-hover:visible' />
								</div>
								<p className='mt-1'>1 {t('general.hour')}</p>
							</div>
						)}
					</>
				))}
				{(!isContainer || isWildcard) && (
					<div className='grid grid-cols-[3fr_1fr_6fr_1fr] gap-4'>
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
