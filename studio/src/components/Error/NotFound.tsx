import { ArrowLeft } from '@phosphor-icons/react';
import { t } from 'i18next';
import React from 'react';
import { Button } from '../Button';
import { Svg404 } from '../icons';

export default function NotFound({ children }: { children?: React.ReactNode }) {
	return (
		<div className='w-full h-screen flex flex-col items-center justify-center'>
			<div className='flex flex-col items-center space-y-2'>
				<Svg404 className='w-16 h-16' />
				<h2 className='text-default text-sm font-semibold'>{t('general.pageNotFound')}</h2>
				<p className='text-xs text-subtle font-sfCompact'>{t('general.errorPageDescription')}</p>
				<p className='text-xs text-subtle font-sfCompact'>{t('general.pageNotFoundDescription')}</p>
			</div>

			{children ?? (
				<Button className='mt-8' variant='primary' to='/organization'>
					<ArrowLeft className='mr-1' />
					{t('general.backToHome')}
				</Button>
			)}
		</div>
	);
}
