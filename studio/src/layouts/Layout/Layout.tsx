import { Header } from '@/components/Header';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<main className='main-layout overflow-hidden'>{children}</main>
		</>
	);
}
