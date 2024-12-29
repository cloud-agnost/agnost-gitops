import { Button } from '@/components/Button';
import { Bitbucket, Github, Gitlab } from '@/components/icons';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Providers() {
	const [_, setSearchParams] = useSearchParams();

	const getCallbackUrl = useCallback((provider: 'github' | 'gitlab' | 'bitbucket') => {
		const redirectURL = new URL(`https://api.agnost.dev/oauth/${provider}`);
		const url = new URL(window.location.href);

		url.searchParams.set('provider', provider);
		redirectURL.searchParams.set('redirect', url.toString());

		return decodeURIComponent(redirectURL.toString());
	}, []);

	function onProviderClick(provider: 'github' | 'gitlab' | 'bitbucket') {
		const url = getCallbackUrl(provider);
		localStorage.setItem('provider', provider);
		setSearchParams({});
		window.location.href = url;
	}

	return (
		<div className='flex flex-col items-center gap-4 w-full'>
			<Button variant='secondary' size='2xl' onClick={() => onProviderClick('github')}>
				<Github className='mr-2 size-5' />
				Continue with GitHub
			</Button>
			<Button variant='secondary' size='2xl' onClick={() => onProviderClick('gitlab')}>
				<Gitlab className='mr-2 size-8' />
				Continue with GitLab
			</Button>
			<Button variant='secondary' size='2xl' onClick={() => onProviderClick('bitbucket')}>
				<Bitbucket className='mr-2 size-4' />
				Continue with Bitbucket
			</Button>
		</div>
	);
}
