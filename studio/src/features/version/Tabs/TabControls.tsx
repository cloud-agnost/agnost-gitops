import { Button } from '@/components/Button';
import { NewTabDropdown, TabOptionsDropdown } from '@/features/version/Tabs/index.ts';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import { CaretLeft, CaretRight, Sidebar } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const SCROLL_AMOUNT = 200;

export default function TabControls({
	scrollContainer,
}: {
	scrollContainer: React.RefObject<HTMLDivElement>;
}) {
	const { versionId } = useParams() as Record<string, string>;
	const [endOfScroll, setEndOfScroll] = useState(false);
	const [startOfScroll, setStartOfScroll] = useState(false);
	const [isScrollable, setIsScrollable] = useState(false);
	const { toggleSidebar, isSidebarOpen } = useUtilsStore();
	const { getTabsByVersionId } = useTabStore();
	const tabs = getTabsByVersionId(versionId);
	function handleScrollEvent() {
		const container = scrollContainer.current;
		if (!container) return;

		const handleScroll = () => {
			setIsScrollable(container.scrollWidth > container.clientWidth);
			setEndOfScroll(container.scrollLeft + container.clientWidth >= container.scrollWidth);
			setStartOfScroll(container.scrollLeft === 0);
		};

		handleScroll();

		container.addEventListener('scroll', handleScroll);

		const resizeObserver = new ResizeObserver(() => {
			handleScroll();
		});

		resizeObserver.observe(container);

		return () => {
			container.removeEventListener('scroll', handleScroll);
			resizeObserver.disconnect();
		};
	}

	function move(type: 'next' | 'prev') {
		const container = scrollContainer.current;
		if (!container) return;

		const scrollAmount = SCROLL_AMOUNT;

		if (type === 'next') {
			container.scrollLeft += scrollAmount;
		} else {
			container.scrollLeft -= scrollAmount;
		}
	}

	useEffect(() => {
		const reset = handleScrollEvent();
		return () => reset?.();
	}, [scrollContainer, tabs]);
	return (
		<div className='tab-control'>
			{isScrollable && (
				<div className='tab-control-item navigation'>
					<Button
						rounded
						variant='icon'
						size='sm'
						onClick={() => move('prev')}
						disabled={startOfScroll}
					>
						<CaretLeft size={15} />
					</Button>
					<Button
						rounded
						variant='icon'
						size='sm'
						onClick={() => move('next')}
						disabled={endOfScroll}
					>
						<CaretRight size={15} />
					</Button>
				</div>
			)}
			<div className='tab-control-item'>
				<Button
					variant={isSidebarOpen ? 'primary' : 'icon'}
					rounded
					iconOnly
					size='sm'
					className='aspect-square'
					onClick={toggleSidebar}
				>
					<Sidebar size={14} />
				</Button>
			</div>
			<div className='tab-control-item'>
				<NewTabDropdown />
			</div>
			<div className='tab-control-item'>
				<TabOptionsDropdown />
			</div>
		</div>
	);
}
