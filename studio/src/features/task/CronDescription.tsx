import { FormDescription } from '@/components/Form';
import { Separator } from '@/components/Separator';
import { describeCronExpression } from '@/utils';
import { useTranslation } from 'react-i18next';

export default function CronDescription() {
	const { t } = useTranslation();
	return (
		<div>
			<FormDescription>{t('task.syntax_description')}</FormDescription>

			<div className='space-y-1 text-xs'>
				<div className='flex items-center space-x-2 mt-4'>
					<p className='text-default'>*</p>
					<p className='text-subtle'>
						any value (e.g. <span className='text-default'>*</span>)
					</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>,</p>
					<p className='text-subtle'>
						value list separator (e.g. <span className='text-default'>1,5</span>)
					</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>-</p>
					<p className='text-subtle'>
						range of values (e.g. <span className='text-default'>1-5</span>)
					</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>/</p>
					<p className='text-subtle'>
						step values (e.g. <span className='text-default'>*/2</span>)
					</p>
				</div>
			</div>

			<Separator className='my-4' />
			<div className='space-y-1 text-xs'>
				<div className='flex items-center space-x-2 mt-4'>
					<p className='text-default'>0 0 * * 1-5</p>
					<p className='text-subtle'>{describeCronExpression('0 0 * * 1-5')}</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>1-59/2 * * * *</p>
					<p className='text-subtle'>{describeCronExpression('1-59/2 * * * *')}</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>0 0 * * *</p>
					<p className='text-subtle'>{describeCronExpression('0 0 * * *')}</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>*/30 * 1,5 * *</p>
					<p className='text-subtle'>{describeCronExpression('*/30 1,5 * * *')}</p>
				</div>
				<div className='flex items-center space-x-2'>
					<p className='text-default'>0 0 * * WED</p>
					<p className='text-subtle'>{describeCronExpression('0 0 * * WED')}</p>
				</div>
			</div>
		</div>
	);
}
