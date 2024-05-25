import { EnvelopeSimple } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Tooltip';

interface Props {
	onResend: () => void;
	disabled?: boolean;
}
export default function ResendButton({ onResend, disabled }: Props) {
	const { t } = useTranslation();

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant='icon' size='sm' rounded disabled={disabled} onClick={onResend}>
						<EnvelopeSimple size={20} />
					</Button>
				</TooltipTrigger>
				<TooltipContent>{t('general.resend_invite')}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
