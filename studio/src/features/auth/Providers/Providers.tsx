import { buttonVariants } from '@/components/Button';
import { Bitbucket, Github, Gitlab } from '@/components/icons';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function Providers() {
	const getCallbackUrl = useCallback((provider: 'github' | 'gitlab' | 'bitbucket') => {
		const hasSearchParam = window.location.href.includes('?');
		return `https://api.agnost.dev/provider/${provider}?redirect=${window.location.href}${
			hasSearchParam ? '&' : '?'
		}provider=${provider}`;
	}, []);

	function onProviderClick(provider: 'github' | 'gitlab' | 'bitbucket') {
		localStorage.setItem('provider', provider);
	}

	return (
		<div className='flex flex-col items-center gap-4 w-full'>
			<Link
				className={buttonVariants({
					variant: 'secondary',
					size: '2xl',
				})}
				to={getCallbackUrl('github')}
				onClick={() => onProviderClick('github')}
			>
				<Github className='mr-2 size-5' />
				Continue with GitHub
			</Link>
			<Link
				className={buttonVariants({
					variant: 'secondary',
					size: '2xl',
				})}
				to={getCallbackUrl('gitlab')}
				onClick={() => onProviderClick('gitlab')}
			>
				<Gitlab className='mr-2 size-8' />
				Continue with GitLab
			</Link>
			<Link
				className={buttonVariants({
					variant: 'secondary',
					size: '2xl',
				})}
				to={getCallbackUrl('bitbucket')}
				onClick={() => onProviderClick('bitbucket')}
			>
				<Bitbucket className='mr-2 size-4' />
				Continue with Bitbucket
			</Link>
		</div>
	);
}
