import { Button } from '@/components/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { BucketCountInfo } from '@/types';
import { CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight } from '@phosphor-icons/react';
import _ from 'lodash';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function Pagination({ countInfo }: { countInfo: BucketCountInfo }) {
	const [searchParams, setSearchParams] = useSearchParams();

	function goToNextPage() {
		const currentPage = paginationInfo?.currentPage;
		const nextPage = currentPage + 1;
		searchParams.set('page', nextPage.toString());
		setSearchParams(searchParams);
	}

	function goToPreviousPage() {
		const currentPage = paginationInfo?.currentPage;
		const previousPage = currentPage - 1;
		searchParams.set('page', previousPage.toString());
		setSearchParams(searchParams);
	}

	function goToFirstPage() {
		searchParams.set('page', '1');
		setSearchParams(searchParams);
	}

	function goToLastPage() {
		const pageCount = countInfo?.totalPages;
		searchParams.set('page', pageCount.toString());
		setSearchParams(searchParams);
	}

	function changePageSize(value: string) {
		searchParams.set('size', value);
		setSearchParams(searchParams);
	}

	const paginationInfo = useMemo(() => calculateIndex(), [countInfo]);

	function formatNumber(number: number) {
		if (_.isNil(number)) return;
		if (number < 1000) return number;
		return number.toLocaleString('en-US', {
			maximumFractionDigits: 2,
			notation: 'standard',
			compactDisplay: 'short',
		});
	}

	function calculateIndex() {
		if (countInfo?.totalCount === 0) {
			return {
				pageIndex: 0,
				dataCount: 0,
				currentPage: 0,
			};
		} else
			return {
				pageIndex:
					countInfo?.currentPage === 1 ? 1 : countInfo?.pageSize * (countInfo?.currentPage - 1) + 1,
				dataCount: countInfo?.pageSize * (countInfo?.currentPage - 1) + countInfo?.count,
				currentPage: countInfo?.currentPage,
			};
	}
	return (
		<div className='flex items-center justify-end mt-4 gap-2'>
			<div className='flex items-center space-x-2'>
				<p className='text-xs '>Rows per page</p>
				<Select value={searchParams.get('size') ?? '25'} onValueChange={changePageSize}>
					<SelectTrigger className='h-8 w-[70px] text-xs'>
						<SelectValue placeholder={25} />
					</SelectTrigger>
					<SelectContent side='top' className='w-[20px]'>
						{[25, 50, 75, 100].map((pageSize) => (
							<SelectItem key={pageSize} value={`${pageSize}`} className='text-xs'>
								{pageSize}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{!_.isNil(countInfo) && (
				<span className='flex items-center justify-center text-xs whitespace-nowrap'>
					{paginationInfo.pageIndex} - {paginationInfo.dataCount} of{' '}
					{formatNumber(countInfo?.totalCount)}
				</span>
			)}
			<div className='flex items-center space-x-2'>
				<Button
					variant='icon'
					size='sm'
					rounded
					className='hidden h-8 w-8 p-0 lg:flex'
					onClick={goToFirstPage}
					disabled={!paginationInfo?.currentPage}
				>
					<span className='sr-only'>Go to first page</span>
					<CaretDoubleLeft className='h-4 w-4' />
				</Button>
				<Button
					variant='icon'
					size='sm'
					rounded
					className='h-8 w-8 p-0'
					onClick={goToPreviousPage}
					disabled={!paginationInfo?.currentPage}
				>
					<span className='sr-only'>Go to previous page</span>
					<CaretLeft className='h-4 w-4' />
				</Button>
				{!_.isNil(countInfo) && (
					<span className='text-xs'>
						{paginationInfo?.currentPage} of{' '}
						{formatNumber(countInfo?.totalCount ? countInfo.totalPages : 0)}
					</span>
				)}
				<Button
					variant='icon'
					size='sm'
					rounded
					className='h-8 w-8 p-0'
					onClick={goToNextPage}
					disabled={countInfo?.totalPages === paginationInfo?.currentPage}
				>
					<span className='sr-only'>Go to next page</span>
					<CaretRight className='h-4 w-4' />
				</Button>
				<Button
					variant='icon'
					size='sm'
					rounded
					className='hidden h-8 w-8 p-0 lg:flex'
					onClick={goToLastPage}
					disabled={countInfo?.totalPages === paginationInfo?.currentPage}
				>
					<span className='sr-only'>Go to last page</span>
					<CaretDoubleRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	);
}
