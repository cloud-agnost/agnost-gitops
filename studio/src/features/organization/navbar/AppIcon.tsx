import { NodejsText } from '@/components/icons';
import { AppWindow } from '@phosphor-icons/react';

export default function AppIcon(props: any) {
	return (
		<>
			<AppWindow {...props} />
			<NodejsText />
		</>
	);
}
