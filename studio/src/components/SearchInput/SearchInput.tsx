import { Input } from '@/components/Input';
import { useDebounce, useUpdateEffect } from '@/hooks';
import { cn } from '@/utils';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../Button';
import './searchInput.scss';
interface SearchInputProps extends React.ComponentPropsWithoutRef<'input'> {
	onSearch?: (value: string) => void;
	onClear?: () => void;
	urlKey?: string;
	canAddParam?: boolean;
	inputClassName?: string;
}

export default function SearchInput({
	className,
	placeholder,
	onClear,
	onSearch,
	value,
	inputClassName,
	urlKey = 'q',
	canAddParam = true,

	...props
}: SearchInputProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [inputValue, setInputValue] = useState<string>((value as string) ?? '');
	const searchTerm = useDebounce(inputValue, 500);
	const { t } = useTranslation();
	const ref = React.useRef<HTMLInputElement>(null);
	function clear() {
		setInputValue(urlKey);
		searchParams.delete(urlKey);
		setSearchParams(searchParams);
		onClear?.();
	}

	function onInput(value: string) {
		value = value.trim();
		if (canAddParam) {
			if (!value) {
				searchParams.delete(urlKey);
			} else {
				searchParams.set(urlKey, value);
			}
			setSearchParams(searchParams);
		}
		onSearch?.(value);
		ref.current?.focus();
	}

	useUpdateEffect(() => {
		onInput?.(searchTerm);
	}, [searchTerm]);

	useUpdateEffect(() => {
		setInputValue(searchParams.get(urlKey) ?? '');
	}, [searchParams.get(urlKey)]);

	return (
		<div className={cn('search-input-wrapper', className)} {...props}>
			<MagnifyingGlass size={16} className='search-input-icon' />
			<Input
				variant='sm'
				ref={ref}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				placeholder={placeholder ?? t('general.search').toString()}
				className={cn('search-input', inputClassName)}
			/>
			{inputValue && (
				<Button
					className='search-input-button !p-1'
					onClick={clear}
					variant='icon'
					size='sm'
					rounded
				>
					<X size={16} />
				</Button>
			)}
		</div>
	);
}
