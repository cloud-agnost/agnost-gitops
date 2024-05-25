import { NavigateFunction, Location } from 'react-router-dom';

interface History {
	navigate: NavigateFunction | null;
	location: Location | null;
}
export const history: History = {
	navigate: null,
	location: null,
};
