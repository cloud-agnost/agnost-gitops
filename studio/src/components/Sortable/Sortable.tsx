import { StrictModeDroppable as Droppable } from 'components/StrictModeDroppable';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

interface SortableProps {
	onDragEnd: (result: DropResult) => void;
	children?: React.ReactNode;
}

export default function Sortable({ onDragEnd, children }: SortableProps) {
	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Droppable droppableId='rate-limits'>
				{(provided) => (
					<div {...provided.droppableProps} ref={provided.innerRef}>
						<ul className='flex flex-col gap-4'>{children}</ul>
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}
