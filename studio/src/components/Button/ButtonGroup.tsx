import React from 'react';
import './Button.scss';
export default function ButtonGroup({ children }: { children: React.ReactNode }) {
	return <div className='btn-group'>{children}</div>;
}
