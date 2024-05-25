import { APIKeyTypes, Endpoint } from '@/types';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';
import { Schema } from '@/features/version/SettingsAPIKeys/index.ts';
import { useTranslation } from 'react-i18next';
import { Badge } from 'components/Badge';
import { ReactNode } from 'react';
import { HTTP_METHOD_BADGE_MAP } from '@/constants';

interface ListEndpointProps {
	type: APIKeyTypes;
	children?: ReactNode;
	endpoints: Endpoint[];
	setEndpoints: (endpoints: any) => void;
}

export default function ListEndpoint({
	type,
	children,
	endpoints,
	setEndpoints,
}: ListEndpointProps) {
	const form = useFormContext<z.infer<typeof Schema>>();
	const { t } = useTranslation();
	const key = type === 'custom-allowed' ? 'allowedEndpoints' : 'excludedEndpoints';
	function clear(index: number) {
		const newValues = endpoints.filter((_, i) => i !== index);
		form.setValue(
			`general.endpoint.${key}`,
			newValues.map((item) => ({ url: item.iid })),
		);
		setEndpoints?.(newValues);
	}

	return (
		<div className='space-y-3'>
			{endpoints.length > 0 ? (
				<>
					<span className='text-subtle text-sm leading-6'>
						{key === 'allowedEndpoints'
							? t('version.api_key.allowed_endpoints')
							: t('version.api_key.excluded_endpoints')}
					</span>
					<div className='flex items-center flex-wrap gap-2'>
						{endpoints.map((item, index) => (
							<Badge
								onClear={() => clear(index)}
								text={`${item.method} ${item.name}`}
								key={index}
								variant={HTTP_METHOD_BADGE_MAP[item.method]}
								className='min-w-[52px] whitespace-nowrap'
							/>
						))}
					</div>
				</>
			) : (
				<span className='text-subtle text-sm leading-6'>
					{t('version.api_key.select_endpoint_desc')}
				</span>
			)}
			<div className='space-y-2'>{children}</div>
		</div>
	);
}
