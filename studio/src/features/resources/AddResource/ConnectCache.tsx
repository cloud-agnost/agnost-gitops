import { ConnectOptions, DatabaseInfo, ReadReplicas } from '@/features/resources';
import { ConnectResourceSchema } from '@/types';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';
export default function ConnectCache() {
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	useEffect(() => {
		form.setValue('access.username', 'root');
	}, []);

	return (
		<>
			<DatabaseInfo modal={false} />
			<ConnectOptions />
			<ReadReplicas />
		</>
	);
}
