import { Label } from '@/components/Label';
import { RadioGroup, RadioGroupItem } from '@/components/RadioGroup';
import { OPERATORS } from '@/constants';
import { Operators } from '@/types';
interface OperatorSelectProps {
	defaultValue: Operators;
	onOperatorChange: (operator: Operators) => void;
}

const OperatorSelect = ({ defaultValue, onOperatorChange }: OperatorSelectProps) => {
	const handleOnOperatorChange = (operator: Operators) => {
		onOperatorChange(operator);
	};
	return (
		<RadioGroup
			onValueChange={handleOnOperatorChange}
			defaultValue={defaultValue ?? Operators.And}
			className='flex items-center gap-6 justify-center'
		>
			{OPERATORS.map((item) => (
				<div className='flex items-center gap-2' key={item.value}>
					<RadioGroupItem value={item.value} id={item.value} />
					<Label htmlFor={item.value}>{item.label}</Label>
				</div>
			))}
		</RadioGroup>
	);
};

export default OperatorSelect;
