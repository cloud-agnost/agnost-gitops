import { Button } from '@/components/Button';
import { Github, Logo } from '@/components/icons';
import { GuestOnly } from '@/router';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
export default function AccountInformation() {
	const { initializeClusterSetup } = useClusterStore();
	const { t } = useTranslation();

	const navigate = useNavigate();

	function handleGithubLogin() {
		//Todo - Add API call to login with Github
		navigate('/register/project');
	}

	return (
		<GuestOnly>
			<div className='space-y-6 max-w-2xl flex flex-col items-center justify-center'>
				<div className='flex flex-col items-center justify-center space-y-3 border-b px-4 py-6 pt-8 text-center sm:px-10'>
					<Logo className='w-48 h-20' />
					<h3 className='text-xl font-semibold'>{t('onboarding.welcome')}</h3>
					<p className='text-sm text-subtle'>{t('onboarding.welcome_desc')}</p>
				</div>
				<Button
					variant='primary'
					className='gap-x-2'
					type='button'
					size='2xl'
					onClick={handleGithubLogin}
				>
					{/* {isLoading && selected === 'github' ? (
								<Spinner className='w-4 h-4' />
							) : (
								<GithubIcon />
							)} */}
					<Github />
					<span>Continue with Github</span>
				</Button>
			</div>
			{/* {error && (
				<Alert className='!max-w-full' variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)} */}
		</GuestOnly>
	);
}
